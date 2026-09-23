// server/services/falService.js (DEPRECATED - Superseded by replicateService.js)
// Retained for backward compatibility reference.
const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '../.env' });

// Configure credentials using environment FAL_KEY
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
} else {
  console.warn('WARNING: FAL_KEY environment variable is not defined!');
}

/**
 * Initiates an asynchronous video generation queue with fal.ai.
 * @param {Object} params
 * @returns {Promise<Object>} Contains video_url, seed, or request_id when webhook is used
 */
async function generateVideo({ endpoint, prompt, duration, resolution, aspect_ratio, generate_audio, image_url, webhookUrl, generationId }) {
  const input = {
    prompt,
    duration: String(duration),
    aspect_ratio,
    generate_audio: !!generate_audio
  };

  if (resolution) input.resolution = resolution;
  if (image_url) input.image_url = image_url;

  try {
    console.log(`[falService] Dispatching queue request to endpoint: ${endpoint}`);

    if (webhookUrl) {
      const result = await fal.queue.submit(endpoint, {
        input,
        webhookUrl: `${webhookUrl}?generationId=${generationId}`
      });
      console.log(`[falService] Submitted to queue, request ID:`, result.request_id);
      return { request_id: result.request_id };
    } else {
      // Fallback to subscribe (polling) if no webhook configured
      const result = await fal.subscribe(endpoint, { input });
      const videoUrl = result.data?.video?.url || result.data?.file?.url || result.data?.outputs?.[0]?.url;
      if (!videoUrl) throw new Error('fal.ai did not return a valid video URL.');
      return { video_url: videoUrl, seed: result.data?.seed };
    }
  } catch (error) {
    console.error('[falService] Video generation failed:', error);
    throw new Error(error.message || 'API request to fal.ai failed');
  }
}

/**
 * Generates a static image synchronously via fal.ai (Flux Schnell / Flux Dev).
 * Blocking call — fal.subscribe waits until the image is ready (typically 5–20s).
 *
 * @param {Object} params
 * @param {string} params.endpoint   - fal.ai endpoint e.g. 'fal-ai/flux/schnell'
 * @param {string} params.prompt     - Text prompt
 * @param {string} params.image_size - Size identifier e.g. 'landscape_4_3', 'square_hd', 'portrait_4_3'
 * @returns {Promise<{ image_url: string, width: number, height: number, seed: number }>}
 */
async function generateImage({ endpoint, prompt, image_size = 'landscape_4_3' }) {
  const isSchnell = endpoint.includes('schnell');

  const input = {
    prompt,
    image_size,
    num_inference_steps: isSchnell ? 4 : 28,
    num_images: 1,
    enable_safety_checker: true
  };

  try {
    console.log(`[falService] Generating image via: ${endpoint}`);
    const result = await fal.subscribe(endpoint, { input });

    const image = result.data?.images?.[0];
    if (!image?.url) throw new Error('fal.ai did not return a valid image URL.');

    return {
      image_url: image.url,
      width: image.width || null,
      height: image.height || null,
      seed: result.data?.seed || null
    };
  } catch (error) {
    console.error('[falService] Image generation failed:', error);
    throw new Error(error.message || 'Image API request to fal.ai failed');
  }
}

module.exports = { generateVideo, generateImage };
