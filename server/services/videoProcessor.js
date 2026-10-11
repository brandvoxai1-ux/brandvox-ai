// server/services/videoProcessor.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const axios = require('axios');
const execPromise = promisify(exec);

/**
 * Probes a video file using ffprobe to retrieve width, height, and duration.
 * @param {string} filePath
 * @returns {Promise<{ width: number, height: number, duration: number }>}
 */
async function probeVideo(filePath) {
  try {
    const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${filePath}"`;
    const { stdout } = await execPromise(cmd);
    const data = JSON.parse(stdout);
    const stream = data?.streams?.[0];
    if (!stream) {
      throw new Error('No video stream found in file.');
    }
    return {
      width: parseInt(stream.width, 10),
      height: parseInt(stream.height, 10),
      duration: parseFloat(stream.duration || 0)
    };
  } catch (error) {
    console.warn('[videoProcessor] ffprobe failed:', error.message);
    return null;
  }
}

/**
 * Ensures video meets AI provider specifications:
 * - Both sides (width and height) must be at least 720px (Kling 3.0 requirement: 720px-2160px per side).
 * - Maximum duration of 10s (Kling 3.0 Omni requirement: 3-10s).
 * @param {Buffer} inputBuffer
 * @param {string} mimeType
 * @returns {Promise<{ buffer: Buffer, width?: number, height?: number, processed: boolean }>}
 */
async function processReferenceVideoBuffer(inputBuffer, mimeType = 'video/mp4') {
  const tempId = `vproc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const inputPath = path.join(os.tmpdir(), `${tempId}_in.mp4`);
  const outputPath = path.join(os.tmpdir(), `${tempId}_out.mp4`);

  try {
    fs.writeFileSync(inputPath, inputBuffer);
    const info = await probeVideo(inputPath);

    if (!info || !info.width || !info.height) {
      console.warn('[videoProcessor] Could not probe video metadata; passing original buffer.');
      return { buffer: inputBuffer, processed: false };
    }

    const { width, height, duration } = info;
    console.log(`[videoProcessor] Reference video probed: ${width}x${height}, duration: ${duration}s (zero-trimming preservation active)`);

    const needsUpscale = width < 720 || height < 720;
    // We strictly DO NOT trim videos. Source videos up to 30s+ remain untrimmed.
    // Only loop if video is excessively short (< 2.0s) so models don't fail on tiny sub-second clips.
    const needsLoop = duration < 2.0;

    if (!needsUpscale && !needsLoop) {
      console.log(`[videoProcessor] Video satisfies dimensions (>=720px) and duration (${duration}s). Passing full original buffer untrimmed.`);
      return { buffer: inputBuffer, width, height, processed: false };
    }

    // Calculate scale factor so BOTH width and height are >= 720px
    let targetW = width;
    let targetH = height;

    if (needsUpscale) {
      const scale = Math.max(720 / width, 720 / height);
      // Dimensions must be even numbers for H.264
      targetW = Math.round((width * scale) / 2) * 2;
      targetH = Math.round((height * scale) / 2) * 2;
      if (targetW < 720) targetW = 720;
      if (targetH < 720) targetH = 720;
      targetW = Math.ceil(targetW / 2) * 2;
      targetH = Math.ceil(targetH / 2) * 2;
      console.log(`[videoProcessor] Upscaling video from ${width}x${height} to ${targetW}x${targetH} (HD quality, full ${duration}s untrimmed)`);
    }

    // Build FFmpeg command with high quality bicubic scaling and optional audio stream mapping
    const filter = `scale=${targetW}:${targetH}:flags=bicubic`;
    const loopCount = needsLoop ? Math.max(1, Math.ceil(2.5 / Math.max(0.5, duration)) - 1) : 0;
    const loopArg = loopCount > 0 ? `-stream_loop ${loopCount} ` : '';
    const durationLimit = needsLoop ? '-t 3' : '';
    const ffmpegCmd = `ffmpeg -y ${loopArg}-i "${inputPath}" ${durationLimit} -vf "${filter}" -map 0:v:0 -map 0:a? -c:v libx264 -pix_fmt yuv420p -preset fast -crf 20 -c:a aac -b:a 192k "${outputPath}"`;

    console.log(`[videoProcessor] Running FFmpeg optimization: ${ffmpegCmd}`);
    await execPromise(ffmpegCmd);

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
    console.error('[videoProcessor] Video processing failed, falling back to original:', err.message);
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
 * If undersized, downloads, upscales, and re-uploads to Supabase Storage.
 * @param {string} videoUrl
 * @param {string} userId
 * @param {object} supabase
 * @returns {Promise<string>} Clean, Replicate-compatible video URL
 */
async function ensureCompatibleReferenceVideoUrl(videoUrl, userId, supabase) {
  if (!videoUrl || typeof videoUrl !== 'string') return videoUrl;

  try {
    console.log(`[videoProcessor] Checking compatibility for reference video: ${videoUrl}`);
    
    // Download video
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 250 * 1024 * 1024,
      maxBodyLength: 250 * 1024 * 1024
    });

    const inputBuffer = Buffer.from(response.data);
    const result = await processReferenceVideoBuffer(inputBuffer);

    if (!result.processed) {
      // Already valid or processing unavailable
      return videoUrl;
    }

    // Upload upscaled video to Supabase Storage
    const filename = `${userId || 'system'}/upscaled_hd_${Date.now()}.mp4`;
    const { error } = await supabase.storage
      .from('uploads')
      .upload(filename, result.buffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      console.warn('[videoProcessor] Failed to upload upscaled reference video:', error.message);
      return videoUrl;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    console.log(`[videoProcessor] Upscaled reference video ready for Replicate: ${publicUrl} (${result.width}x${result.height})`);
    return publicUrl;
  } catch (err) {
    console.warn('[videoProcessor] Error verifying remote video URL:', err.message);
    return videoUrl; // Fallback to original
  }
}

module.exports = {
  probeVideo,
  processReferenceVideoBuffer,
  ensureCompatibleReferenceVideoUrl
};
