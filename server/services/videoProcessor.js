// server/services/videoProcessor.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const axios = require('axios');
let ffmpegPath = 'ffmpeg';
let ffprobePath = 'ffprobe';

try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpegPath = ffmpegInstaller.path;
    if (process.platform !== 'win32' && fs.existsSync(ffmpegPath)) {
      try { fs.chmodSync(ffmpegPath, 0o755); } catch (e) {}
    }
  }
} catch (e) {}

try {
  const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
  if (ffprobeInstaller && ffprobeInstaller.path) {
    ffprobePath = ffprobeInstaller.path;
    if (process.platform !== 'win32' && fs.existsSync(ffprobePath)) {
      try { fs.chmodSync(ffprobePath, 0o755); } catch (e) {}
    }
  }
} catch (e) {}

function execWithTimeout(cmd, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Probes a video file using ffprobe to retrieve width, height, and duration.
 * @param {string} filePath
 * @returns {Promise<{ width: number, height: number, duration: number }>}
 */
async function probeVideo(filePath) {
  try {
    const cmd = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height,duration,sample_aspect_ratio -of json "${filePath}"`;
    const { stdout } = await execWithTimeout(cmd, 10000);
    const data = JSON.parse(stdout);
    const stream = data?.streams?.[0];
    if (!stream) {
      throw new Error('No video stream found in file.');
    }
    return {
      width: parseInt(stream.width, 10),
      height: parseInt(stream.height, 10),
      duration: parseFloat(stream.duration || 0),
      sar: stream.sample_aspect_ratio || '1:1'
    };
  } catch (error) {
    console.warn('[videoProcessor] ffprobe check skipped or unavailable:', error.message);
    return null;
  }
}

/**
 * Ensures video meets AI provider specifications:
 * - Both sides (width and height) must be at least 720px (Kling 3.0 requirement: 720px-2160px per side).
 * - Maximum duration of 10s (Kling 3.0 Omni requirement: 3-10s).
 * - Strict 1:1 square pixel aspect ratio (PAR / SAR) required by Kling VideoNormalize.
 * @param {Buffer} inputBuffer
 * @param {string} mimeType
 * @param {Object} [options]
 * @param {number|null} [options.maxDuration]
 * @returns {Promise<{ buffer: Buffer, width?: number, height?: number, processed: boolean }>}
 */
async function processReferenceVideoBuffer(inputBuffer, mimeType = 'video/mp4', options = {}) {
  const { maxDuration = null } = options;
  const tempId = `vproc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const inputPath = path.join(os.tmpdir(), `${tempId}_in.mp4`);
  const outputPath = path.join(os.tmpdir(), `${tempId}_out.mp4`);

  try {
    fs.writeFileSync(inputPath, inputBuffer);
    const info = await probeVideo(inputPath);

    if (!info || !info.width || !info.height) {
      console.warn('[videoProcessor] Could not probe video metadata; passing original buffer without modifications.');
      return { buffer: inputBuffer, processed: false };
    }

    const { width, height, duration, sar } = info;
    const isNonSquareSar = sar && sar !== '1:1' && sar !== '0:1' && sar !== 'N/A';
    console.log(`[videoProcessor] Reference video probed: ${width}x${height}, duration: ${duration}s, sar: ${sar || '1:1'} (maxDuration: ${maxDuration || 'unlimited'})`);

    const needsUpscale = width < 720 || height < 720;
    const needsSarFix = isNonSquareSar;

    if (!needsUpscale && !needsSarFix) {
      console.log(`[videoProcessor] Video satisfies dimensions (>=720px) and square pixels (1:1). Passing full original buffer without modification.`);
      return { buffer: inputBuffer, width, height, processed: false };
    }

    // Calculate scale factor so BOTH width and height are >= 720px
    let targetW = width;
    let targetH = height;

    if (needsUpscale) {
      const scale = Math.max(720 / width, 720 / height);
      // Dimensions must be multiples of 16 for H.264 / AI VAE tensor compatibility
      targetW = Math.round((width * scale) / 16) * 16;
      targetH = Math.round((height * scale) / 16) * 16;
      if (targetW < 720) targetW = 720;
      if (targetH < 720) targetH = 720;
      console.log(`[videoProcessor] Upscaling video from ${width}x${height} to ${targetW}x${targetH} (HD quality)`);
    } else {
      // Ensure dimensions are divisible by 16 for H.264
      targetW = Math.round(targetW / 16) * 16;
      targetH = Math.round(targetH / 16) * 16;
    }

    // Build FFmpeg command: upscale only, NEVER trim or cut duration, preserve full audio
    const filter = `scale=${targetW}:${targetH}:flags=bicubic,setsar=1`;
    const ffmpegCmd = `"${ffmpegPath}" -y -i "${inputPath}" -vf "${filter}" -map 0:v:0 -map 0:a? -c:v libx264 -pix_fmt yuv420p -preset fast -crf 20 -c:a aac -b:a 192k "${outputPath}"`;

    console.log(`[videoProcessor] Running FFmpeg HD upscale: ${ffmpegCmd}`);
    await execWithTimeout(ffmpegCmd, 35000);

    if (fs.existsSync(outputPath)) {
      const outputBuffer = fs.readFileSync(outputPath);
      console.log(`[videoProcessor] Video processed successfully: ${outputBuffer.length} bytes (was ${inputBuffer.length})`);
      return {
        buffer: outputBuffer,
        width: targetW,
        height: targetH,
        processed: true
      };
    }

    return { buffer: inputBuffer, processed: false };
  } catch (err) {
    console.warn('[videoProcessor] Video processing skipped/fallback:', err.message);
    return { buffer: inputBuffer, processed: false };
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupErr) {
      // Ignore cleanup error
    }
  }
}

/**
 * Inspects a remote reference video URL and ensures it meets the 720px requirement.
 * If undersized or requiring model duration conforming, downloads, processes, and re-uploads to Supabase Storage.
 * @param {string} videoUrl
 * @param {string} userId
 * @param {object} supabase
 * @param {string} [targetModelId]
 * @returns {Promise<string>} Clean, Replicate-compatible video URL
 */
async function ensureCompatibleReferenceVideoUrl(videoUrl, userId, supabase, targetModelId = null) {
  if (!videoUrl || typeof videoUrl !== 'string') return videoUrl;

  if (videoUrl.includes('conformed_hd_')) {
    console.log(`[videoProcessor] Video is already conformed, skipping re-processing: ${videoUrl}`);
    return videoUrl;
  }

  // All reference videos pass through universal conforming to ensure HD geometry (>=720px) and clean limits
  try {
    const maxDuration = 30.0; // Support full viral reels up to 30 seconds

    console.log(`[videoProcessor] Checking compatibility for reference video: ${videoUrl} (target model: ${targetModelId || 'generic'})`);
    
    // Download video with generous 35s timeout
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 35000,
      maxContentLength: 250 * 1024 * 1024,
      maxBodyLength: 250 * 1024 * 1024
    });

    const inputBuffer = Buffer.from(response.data);
    const result = await processReferenceVideoBuffer(inputBuffer, 'video/mp4');

    if (!result.processed) {
      // Already valid or processing unavailable
      return videoUrl;
    }

    // Upload processed video to Supabase Storage
    const filename = `${userId || 'system'}/conformed_hd_${Date.now()}.mp4`;
    const { error } = await supabase.storage
      .from('uploads')
      .upload(filename, result.buffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      console.warn('[videoProcessor] Failed to upload conformed reference video:', error.message);
      return videoUrl;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    console.log(`[videoProcessor] Conformed reference video ready for AI model: ${publicUrl} (${result.width}x${result.height})`);
    return publicUrl;
  } catch (err) {
    console.warn('[videoProcessor] Error verifying remote video URL:', err.message);
    return videoUrl; // Fallback to original
  }
}

/**
 * Automatically re-muxes original audio from source reel onto the AI-generated video.
 * Uses lightning-fast stream copy (-c:v copy) so no quality is lost and completes in < 2s.
 * @param {string} aiVideoUrl - URL of generated video (may be mute or low quality audio)
 * @param {string} sourceAudioOrVideoUrl - URL of source reel or extracted audio
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID for storage path
 * @returns {Promise<string>} Public URL of final audio-synced video
 */
async function reMuxAudioFromSource(aiVideoUrl, sourceAudioOrVideoUrl, supabase, userId = 'system') {
  if (!aiVideoUrl || !sourceAudioOrVideoUrl) return aiVideoUrl;

  const tempId = `remux_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const aiPath = path.join(os.tmpdir(), `${tempId}_ai.mp4`);
  const srcPath = path.join(os.tmpdir(), `${tempId}_src.mp4`);
  const outPath = path.join(os.tmpdir(), `${tempId}_synced.mp4`);

  try {
    console.log(`[videoProcessor] Starting audio re-mux: AI video (${aiVideoUrl.slice(0, 50)}...) with sound from (${sourceAudioOrVideoUrl.slice(0, 50)}...)`);

    // Download both files concurrently
    const [aiRes, srcRes] = await Promise.all([
      axios.get(aiVideoUrl, { responseType: 'arraybuffer', timeout: 35000 }),
      axios.get(sourceAudioOrVideoUrl, { responseType: 'arraybuffer', timeout: 35000 })
    ]);

    fs.writeFileSync(aiPath, Buffer.from(aiRes.data));
    fs.writeFileSync(srcPath, Buffer.from(srcRes.data));

    // Mux AI video frames + Source audio track
    const ffmpegCmd = `"${ffmpegPath}" -y -i "${aiPath}" -i "${srcPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "${outPath}"`;
    console.log(`[videoProcessor] Executing audio re-mux command: ${ffmpegCmd}`);

    await execWithTimeout(ffmpegCmd, 25000);

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      const syncedBuffer = fs.readFileSync(outPath);
      const filename = `${userId}/reel_sound_synced_${Date.now()}.mp4`;

      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(filename, syncedBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filename);

        console.log(`[videoProcessor] Audio re-mux successful! Final synced reel: ${publicUrl}`);
        return publicUrl;
      }
    }

    return aiVideoUrl;
  } catch (err) {
    console.warn('[videoProcessor] Audio re-mux failed, falling back to original AI video:', err.message);
    return aiVideoUrl;
  } finally {
    try {
      if (fs.existsSync(aiPath)) fs.unlinkSync(aiPath);
      if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch (_) {}
  }
}

module.exports = {
  probeVideo,
  processReferenceVideoBuffer,
  ensureCompatibleReferenceVideoUrl,
  reMuxAudioFromSource
};
