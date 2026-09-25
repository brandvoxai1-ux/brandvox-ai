// server/services/replicateService.js
const Replicate = require('replicate');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const replicateToken = process.env.REPLICATE_API_TOKEN;
if (!replicateToken) {
  console.warn('WARNING: REPLICATE_API_TOKEN environment variable is not defined!');
}

const replicate = new Replicate({
  auth: replicateToken
});

/**
 * Maps legacy or fal.ai model endpoints to Replicate model identifiers
 */
const REPLICATE_MODEL_MAP = {
  // SOTA Image Models (2025/2026)
  'fal-ai/flux/schnell': 'black-forest-labs/flux-schnell',
  'fal-ai/flux/dev': 'black-forest-labs/flux-dev',
  'nano-banana': 'black-forest-labs/flux-schnell',
  'chatgpt-image': 'ideogram-ai/ideogram-v2',
  'p-image-ideogram': 'black-forest-labs/flux-schnell',
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev',
  'ideogram-v2': 'ideogram-ai/ideogram-v2',
  
  // SOTA Video Models (2025/2026)
  'fal-ai/minimax/video-01': 'minimax/video-01',
  'minimax-hailuo': 'minimax/video-01',
  'fal-ai/kling-video/v1.6/standard/text-to-video': 'kuaishou/kling-v1',
  'kling-video-1-6': 'kuaishou/kling-v1',
  'fal-ai/wan/v2.5/text-to-video': 'wan-video/wan-2.1-1.3b',
  'wan-2-5-fast': 'wan-video/wan-2.1-1.3b',
  'wan-2-1-14b': 'wan-video/wan-2.1-14b',
  'fal-ai/hunyuan-video': 'wan-video/wan-2.1-1.3b',
  'seedance-2-0-fast': 'wan-video/wan-2.1-1.3b',
  'seedance-2-fast': 'wan-video/wan-2.1-1.3b',
  'seedance-2': 'wan-video/wan-2.1-1.3b',
  'seedance-2-i2v': 'minimax/video-01',
  'bytedance/seedance-2.0/fast/text-to-video': 'wan-video/wan-2.1-1.3b',
  'bytedance/seedance-2.0/text-to-video': 'wan-video/wan-2.1-1.3b',
  'bytedance/seedance-2.0/image-to-video': 'minimax/video-01'
};

/**
 * Resolves a model endpoint string to a valid Replicate model identifier
 */
function resolveReplicateModel(endpoint, defaultModel = 'black-forest-labs/flux-schnell') {
  if (!endpoint) return defaultModel;
  if (REPLICATE_MODEL_MAP[endpoint]) {
    return REPLICATE_MODEL_MAP[endpoint];
  }
  // If already in owner/model format (e.g. wan-video/wan-2.1-1.3b)
  if (endpoint.includes('/') && !endpoint.startsWith('fal-ai/')) {
    return endpoint;
  }
  return defaultModel;
}

/**
 * Safely extracts media URL from Replicate run/prediction output
 */
function extractMediaUrl(output) {
  if (!output) return null;

  if (Array.isArray(output) && output.length > 0) {
    return extractMediaUrl(output[0]);
  }

  // Modern Replicate FileOutput object has .url() method returning a URL object
  if (typeof output.url === 'function') {
    const res = output.url();
    return res?.href || String(res);
  }

  if (typeof output === 'object' && output.url) {
    const res = typeof output.url === 'function' ? output.url() : output.url;
    return res?.href || String(res);
  }

  if (typeof output === 'string') {
    return output;
  }

  const str = String(output?.href || output);
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  return null;
}

/**
 * Helper to compute aspect ratio dimensions
 */
function getDimensions(aspectRatio) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720, aspect_ratio: '16:9' };
    case '9:16':
      return { width: 720, height: 1280, aspect_ratio: '9:16' };
    case '4:3':
      return { width: 1024, height: 768, aspect_ratio: '4:3' };
    case '3:4':
      return { width: 768, height: 1024, aspect_ratio: '3:4' };
    case '1:1':
    default:
      return { width: 1024, height: 1024, aspect_ratio: '1:1' };
  }
}

/**
 * Generates an image via Replicate (defaulting to prunaai/p-image-ideogram)
 * @param {Object} params
 * @param {string} params.endpoint   - Model identifier or fal alias
 * @param {string} params.prompt     - Text prompt
 * @param {string} params.aspect_ratio - Aspect ratio string ('1:1', '16:9', etc.)
 * @returns {Promise<{ image_url: string, width: number, height: number, seed: null }>}
 */
async function generateImage({ endpoint, prompt, aspect_ratio = '1:1' }) {
  const model = resolveReplicateModel(endpoint, 'black-forest-labs/flux-schnell');
  const dims = getDimensions(aspect_ratio);

  let input;
  if (model.includes('ideogram')) {
    input = {
      prompt,
      aspect_ratio: dims.aspect_ratio || '1:1',
      output_format: 'jpg',
      output_quality: 90
    };
  } else {
    // FLUX.1 Schnell / Dev
    input = {
      prompt,
      aspect_ratio: dims.aspect_ratio || '1:1',
      output_format: 'webp',
      output_quality: 90
    };
  }

  try {
    console.log(`[replicateService] Generating image via Replicate: ${model}`);
    console.log(`[replicateService] Input:`, JSON.stringify(input));

    const output = await replicate.run(model, { input });
    const imageUrl = extractMediaUrl(output);

    if (!imageUrl) {
      console.error('[replicateService] Replicate returned unrecognized output:', output);
      throw new Error('Replicate did not return a valid image URL.');
    }

    console.log(`[replicateService] Image generated successfully: ${imageUrl}`);
    return {
      image_url: imageUrl,
      width: dims.width,
      height: dims.height,
      seed: null
    };
  } catch (error) {
    console.error('[replicateService] Image generation failed:', error);
    throw new Error(error.message || 'Image API request to Replicate failed');
  }
}

/**
 * Generates an AI video via Replicate
 * @param {Object} params
 * @returns {Promise<{ video_url?: string, request_id?: string }>}
 */
async function generateVideo({ endpoint, prompt, duration, resolution, aspect_ratio, generate_audio, image_url, webhookUrl, generationId }) {
  const model = resolveReplicateModel(endpoint, 'minimax/video-01');

  const input = { prompt };

  if (model.includes('minimax')) {
    input.prompt_optimizer = true;
    if (image_url) input.first_frame_image = image_url;
  } else if (model.includes('wan')) {
    // Wan 2.1 SOTA accepts aspect_ratio ('16:9', '9:16', '1:1')
    input.aspect_ratio = aspect_ratio || '16:9';
    if (image_url) input.image = image_url;
  } else if (model.includes('kling')) {
    if (image_url) input.start_image = image_url;
  } else {
    if (image_url) input.first_frame_image = image_url;
  }

  try {
    console.log(`[replicateService] Generating video via Replicate: ${model}`);

    if (webhookUrl && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
      // Dispatch prediction with production webhook
      const prediction = await replicate.predictions.create({
        model,
        input,
        webhook: `${webhookUrl}?generationId=${generationId}`,
        webhook_events_filter: ['completed']
      });

      console.log(`[replicateService] Created prediction queue ID: ${prediction.id}`);
      return { request_id: prediction.id };
    } else {
      // Run synchronously or poll until complete (ideal for local development and reliable execution)
      console.log(`[replicateService] Running prediction and awaiting result for: ${model}`);
      const output = await replicate.run(model, { input });
      const videoUrl = extractMediaUrl(output);

      if (!videoUrl) {
        throw new Error('Replicate did not return a valid video URL.');
      }

      console.log(`[replicateService] Video generated successfully: ${videoUrl}`);
      return { video_url: videoUrl };
    }
  } catch (error) {
    console.error('[replicateService] Video generation failed:', error);
    throw new Error(error.message || 'API request to Replicate failed');
  }
}

/**
 * Polls status of a prediction ID
 */
async function getPredictionStatus(predictionId) {
  try {
    const prediction = await replicate.predictions.get(predictionId);
    return {
      id: prediction.id,
      status: prediction.status, // 'starting', 'processing', 'succeeded', 'failed', 'canceled'
      output: prediction.output,
      error: prediction.error
    };
  } catch (error) {
    console.error(`[replicateService] Failed to get prediction status for ${predictionId}:`, error);
    throw error;
  }
}

module.exports = {
  generateImage,
  generateVideo,
  getPredictionStatus,
  extractMediaUrl,
  resolveReplicateModel,
  replicate
};
