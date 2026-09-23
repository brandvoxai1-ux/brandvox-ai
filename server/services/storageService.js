// server/services/storageService.js
const axios = require('axios');
const supabase = require('../lib/supabase');

/**
 * Downloads a video from a temporary URL and archives it to Supabase Storage
 * @param {string} videoUrl - Ephemeral source URL from fal.ai
 * @param {string} userId - Owner user UUID
 * @param {string} generationId - Unique generation UUID
 * @returns {Promise<string>} - Permanent public URL of the archived video
 */
async function archiveVideo(videoUrl, userId, generationId) {
  if (!videoUrl) return null;

  try {
    console.log(`[StorageService] Commencing video archiving. Source URL: ${videoUrl}`);
    
    // Download the video binary data
    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds download timeout
    });

    const fileBuffer = Buffer.from(response.data, 'binary');
    const filename = `${userId}/${generationId}.mp4`;

    console.log(`[StorageService] Uploading video to Supabase bucket 'videos': ${filename}`);
    
    // Upload buffer directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filename, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Resolve public URL for the newly archived file
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filename);

    console.log(`[StorageService] Archiving complete. Permanent URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[StorageService] Failed to archive video from ${videoUrl}:`, err.message);
    // Fallback: Return the original URL so the generation record doesn't become empty
    return videoUrl;
  }
}

/**
 * Downloads an image from a temporary URL and archives it to Supabase Storage
 * @param {string} imageUrl - Ephemeral source URL
 * @param {string} userId - Owner user UUID
 * @param {string} generationId - Unique generation UUID
 * @returns {Promise<string>} - Permanent public URL of the archived image
 */
async function archiveImage(imageUrl, userId, generationId) {
  if (!imageUrl) return null;

  try {
    console.log(`[StorageService] Commencing image archiving. Source URL: ${imageUrl}`);

    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 20000
    });

    const fileBuffer = Buffer.from(response.data, 'binary');
    const filename = `${userId}/${generationId}.jpg`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filename);

    console.log(`[StorageService] Image archived. Permanent URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.warn(`[StorageService] Non-critical: Failed to archive image to Supabase, returning source URL:`, err.message);
    return imageUrl;
  }
}

module.exports = { archiveVideo, archiveImage };
