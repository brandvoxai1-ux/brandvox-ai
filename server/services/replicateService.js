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
  'chatgpt-image-2': 'ideogram-ai/ideogram-v2',
  'nano-banana-2': 'black-forest-labs/flux-dev',
  'p-image-ideogram': 'black-forest-labs/flux-schnell',
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev',
  'ideogram-v2': 'ideogram-ai/ideogram-v2',
  
  // SOTA Video Models (2025/2026)
  'fal-ai/minimax/video-01': 'minimax/video-01',
  'minimax-hailuo': 'minimax/video-01',
  'google-veo-3': 'kwaivgi/kling-v3-video',
  'fal-ai/kling-video/v1.6/standard/text-to-video': 'kwaivgi/kling-v3-video',
  'kling-video-1-6': 'kwaivgi/kling-v3-video',
  'kling-3-omni': 'kwaivgi/kling-v3-omni-video',
  'kuaishou/kling-v1': 'kwaivgi/kling-v3-video',
  'kuaishou/kling-video': 'kwaivgi/kling-v3-video',
  'kwaivgi/kling-v1': 'kwaivgi/kling-v3-video',
  'kwaivgi/kling-v1.6': 'kwaivgi/kling-v3-video',
  'fal-ai/wan/v2.5/text-to-video': 'wan-video/wan-2.1-1.3b',
  'wan-2-5-fast': 'wan-video/wan-2.1-1.3b',
  'wan-2-1-14b': 'wan-video/wan-2.1-1.3b',
  'wan-video/wan-2.1-14b': 'wan-video/wan-2.1-1.3b',
  'wan-video/wan-2.1': 'wan-video/wan-2.1-1.3b',
  'wan-3': 'wan-video/wan-2.1-1.3b',
  'fal-ai/hunyuan-video': 'wan-video/wan-2.1-1.3b',
  'seedance-2-0-fast': 'bytedance/seedance-2.0',
  'seedance-2-fast': 'bytedance/seedance-2.0',
  'seedance-2': 'bytedance/seedance-2.0',
  'seedance-2-i2v': 'bytedance/seedance-2.0',
  'bytedance/seedance-2.0/fast/text-to-video': 'bytedance/seedance-2.0',
  'bytedance/seedance-2.0/text-to-video': 'bytedance/seedance-2.0',
  'bytedance/seedance-2.0/image-to-video': 'bytedance/seedance-2.0',
  'bytedance/seedance-2.0': 'bytedance/seedance-2.0'
};

/**
 * Resolves a model endpoint string to a valid Replicate model identifier
 */
function resolveReplicateModel(endpoint, defaultModel = 'black-forest-labs/flux-schnell') {
  if (!endpoint) return defaultModel;
  if (REPLICATE_MODEL_MAP[endpoint]) {
    return REPLICATE_MODEL_MAP[endpoint];
  }
  // Intercept any invalid kuaishou or legacy naming
  if (endpoint.startsWith('kuaishou/')) {
    if (endpoint.includes('omni')) return 'kwaivgi/kling-v3-omni-video';
    return 'kwaivgi/kling-v3-video';
  }
  // If already in owner/model format (e.g. wan-video/wan-2.1-1.3b, kwaivgi/kling-v3-video)
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
 * Generates an image via Replicate (FLUX / Ideogram v2)
 * Supports text-to-image and image-to-image remixing
 * @param {Object} params
 * @param {string} params.endpoint     - Model identifier or alias
 * @param {string} params.prompt       - Text prompt
 * @param {string} params.aspect_ratio - Aspect ratio string ('1:1', '16:9', etc.)
 * @param {string} [params.input_image]- Optional input image URL for I2I remix
 * @returns {Promise<{ image_url: string, width: number, height: number, seed: null }>}
 */
async function generateImage({ endpoint, prompt, aspect_ratio = '1:1', input_image = null }) {
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
    if (input_image) {
      input.image_url = input_image;
    }
  } else {
    // FLUX.1 Schnell / Dev
    input = {
      prompt,
      aspect_ratio: dims.aspect_ratio || '1:1',
      output_format: 'webp',
      output_quality: 90
    };
    if (input_image) {
      input.image = input_image;
      input.prompt_strength = 0.8;
    }
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
 * Character Replacement / Video-to-Video Motion Transfer Generation
 * Takes a source motion video + target character reference image/prompt
 * @param {Object} params
 * @param {string} [params.endpoint]
 * @param {string} params.source_video
 * @param {string} [params.target_character]
 * @param {string} [params.prompt]
 * @param {string} [params.aspect_ratio]
 * @param {string} [params.webhookUrl]
 * @param {string} [params.generationId]
 */
async function generateCharacterSwapVideo({
  endpoint = 'kling-3-omni',
  source_video,
  target_character,
  characters = [],
  prop_image,
  prompt,
  aspect_ratio = '16:9',
  webhookUrl,
  generationId
}) {
  const resolved = resolveReplicateModel(endpoint, 'kwaivgi/kling-v3-omni-video');
  
  // Guarantee character swap uses a true V2V motion transfer model
  const model = resolved.includes('seedance')
    ? 'bytedance/seedance-2.0'
    : 'kwaivgi/kling-v3-omni-video';

  const input = {};

  // Normalize characters list (supports both new multi-character array and legacy single target_character)
  let characterList = Array.isArray(characters) && characters.length > 0 ? [...characters] : [];
  if (characterList.length === 0 && target_character && String(target_character).trim()) {
    characterList = [{ target_image_url: String(target_character).trim(), label: 'main character' }];
  }

  // Filter valid character image URLs
  const validPhotos = characterList
    .map(c => typeof c === 'string' ? { target_image_url: c, label: '' } : c)
    .filter(c => c && c.target_image_url && String(c.target_image_url).trim());

  const hasTargetPhotos = validPhotos.length > 0;
  const hasPropImage = prop_image && typeof prop_image === 'string' && prop_image.trim().length > 0;
  const propIndex = validPhotos.length + 1;

  // Build reference_images array: characters first, then optional prop/object
  const allReferenceImages = validPhotos.map(c => c.target_image_url);
  if (hasPropImage) {
    allReferenceImages.push(prop_image.trim());
  }

  // Helper to translate Google Flow @tag mentions into model-native syntax
  const translatePromptTags = (rawPrompt, isSeedance) => {
    if (!rawPrompt || !rawPrompt.trim()) return '';
    const { sanitizePromptForVideo } = require('./promptSanitizer');
    let p = sanitizePromptForVideo(rawPrompt);
    // Replace @Motion
    p = p.replace(/@Motion\b/gi, isSeedance ? '[Video1]' : '<<<video_1>>>');
    // Replace @Char 1..5 or @Char1..5
    for (let i = 1; i <= 5; i++) {
      const charRegex = new RegExp(`@Char\\s*${i}\\b`, 'gi');
      p = p.replace(charRegex, isSeedance ? `[Image${i}]` : `<<<image_${i}>>>`);
    }
    // Replace @Prop or @Object
    const propToken = isSeedance ? `[Image${propIndex}]` : `<<<image_${propIndex}>>>`;
    p = p.replace(/@(Prop|Object)\b/gi, propToken);
    return p;
  };

  if (model.includes('seedance')) {
    const userPromptTranslated = translatePromptTags(prompt, true);
    const propDirective = hasPropImage ? `, with object [Image${propIndex}]` : '';

    if (hasTargetPhotos) {
      if (validPhotos.length === 1) {
        const charLabel = validPhotos[0].label?.trim() ? `the ${validPhotos[0].label}` : 'the main character';
        input.prompt = userPromptTranslated
          ? `Replace ${charLabel} in [Video1] with person in [Image1]${propDirective}. ${userPromptTranslated}`
          : `Replace ${charLabel} in [Video1] with person in [Image1]${propDirective}, seamless motion transfer`;
      } else {
        const directives = validPhotos.map((c, i) => {
          const desc = c.label?.trim() ? `the ${c.label}` : `character ${i + 1}`;
          return `replace ${desc} in [Video1] with [Image${i + 1}]`;
        }).join(', and ');
        input.prompt = `Multi-character replacement in [Video1]: ${directives}${propDirective}. ${userPromptTranslated || 'seamless motion transfer'}`;
      }
      input.reference_images = allReferenceImages;
    } else {
      input.prompt = userPromptTranslated || 'Seamless motion transfer in [Video1]';
      if (hasPropImage) {
        input.reference_images = allReferenceImages;
      }
    }
    if (source_video) input.reference_videos = [source_video];
    input.resolution = '720p';
    input.generate_audio = true;
  } else {
    // Kling v3 Omni Director
    const userPromptTranslated = translatePromptTags(prompt, false);
    const propDirective = hasPropImage ? `, with object <<<image_${propIndex}>>>` : '';

    if (hasTargetPhotos) {
      if (validPhotos.length === 1) {
        const charLabel = validPhotos[0].label?.trim() ? `(${validPhotos[0].label})` : 'main character';
        input.prompt = userPromptTranslated
          ? `Replace ${charLabel} in <<<video_1>>> with <<<image_1>>>${propDirective}. ${userPromptTranslated}`
          : `Replace ${charLabel} in <<<video_1>>> with <<<image_1>>>${propDirective}, photorealistic motion transfer`;
      } else {
        const directives = validPhotos.map((c, i) => {
          const desc = c.label?.trim() ? `(${c.label})` : `character ${i + 1}`;
          return `replace ${desc} with <<<image_${i + 1}>>>`;
        }).join(', and ');
        input.prompt = `Multi-character replacement in <<<video_1>>>: ${directives}${propDirective}. ${userPromptTranslated || 'photorealistic motion transfer'}`;
      }
      input.reference_images = allReferenceImages;
    } else {
      input.prompt = userPromptTranslated || 'Transform character in <<<video_1>>>, photorealistic motion transfer';
      if (hasPropImage) {
        input.reference_images = allReferenceImages;
      }
    }
    if (source_video) {
      input.reference_video = source_video;
      input.video_reference_type = 'base';
      input.keep_original_sound = true;
    }
    input.mode = 'pro';
  }

  try {
    console.log(`[replicateService] Generating Character Swap V2V video via Replicate: ${model}`);
    console.log(`[replicateService] Source Video: ${source_video}`);
    console.log(`[replicateService] Target Characters (${validPhotos.length}):`, validPhotos.map(p => p.label || p.target_image_url));

    if (webhookUrl && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
      const prediction = await replicate.predictions.create({
        model,
        input,
        webhook: `${webhookUrl}?generationId=${generationId}`,
        webhook_events_filter: ['completed']
      });

      console.log(`[replicateService] Created V2V prediction queue ID: ${prediction.id}`);
      return { request_id: prediction.id };
    } else {
      console.log(`[replicateService] Running V2V prediction synchronously for: ${model}`);
      const output = await replicate.run(model, { input });
      const videoUrl = extractMediaUrl(output);

      if (!videoUrl) {
        throw new Error('Replicate did not return a valid video URL for character swap.');
      }

      console.log(`[replicateService] Character swap video generated successfully: ${videoUrl}`);
      return { video_url: videoUrl };
    }
  } catch (error) {
    console.error('[replicateService] Character swap video generation failed:', error);
    throw new Error(error.message || 'Character replacement API request failed');
  }
}

/**
 * Generates an AI video via Replicate
 * @param {Object} params
 * @returns {Promise<{ video_url?: string, request_id?: string }>}
 */
async function generateVideo({ endpoint, prompt, duration, resolution, aspect_ratio, generate_audio, image_url, webhookUrl, generationId }) {
  const model = resolveReplicateModel(endpoint, 'minimax/video-01');

  const { sanitizePromptForVideo } = require('./promptSanitizer');
  const cleanPrompt = sanitizePromptForVideo(prompt);

  const input = { prompt: cleanPrompt };
  const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

  if (model.includes('seedance')) {
    input.resolution = resolution || '720p';
    // When reference/start image is provided, use 'adaptive' per ByteDance specification
    // to match image natural geometry and prevent 'Image pixel is invalid' errors
    input.aspect_ratio = cleanImageUrl ? 'adaptive' : (aspect_ratio || '16:9');
    if (duration) {
      const parsedDur = parseInt(duration, 10);
      if (!isNaN(parsedDur)) {
        input.duration = Math.max(3, Math.min(15, parsedDur));
      }
    }
    input.generate_audio = generate_audio !== false;
    if (cleanImageUrl) input.image = cleanImageUrl;
  } else if (model.includes('minimax')) {
    input.prompt_optimizer = true;
    if (cleanImageUrl) input.first_frame_image = cleanImageUrl;
  } else if (model.includes('wan')) {
    // Wan 2.1 1.3b on Replicate strictly allows ONLY "480p"
    input.aspect_ratio = aspect_ratio || '16:9';
    input.resolution = '480p';
    if (cleanImageUrl) input.image = cleanImageUrl;
  } else if (model.includes('kling')) {
    input.aspect_ratio = aspect_ratio || '16:9';
    if (duration) {
      const parsedDur = parseInt(duration, 10);
      if (!isNaN(parsedDur)) {
        input.duration = Math.max(3, Math.min(15, parsedDur));
      }
    }
    if (cleanImageUrl) input.start_image = cleanImageUrl;
    input.generate_audio = generate_audio !== false;
    if (resolution === '1080p') {
      input.mode = 'pro';
    } else {
      input.mode = 'standard';
    }
    input.negative_prompt = 'blurry, low quality, distorted, deformed faces, bad anatomy, amateur, jittery, watermark, oversaturated';
  } else {
    if (cleanImageUrl) input.first_frame_image = cleanImageUrl;
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
    const errorMsg = String(error?.message || error || '');
    if ((errorMsg.includes('E005') || errorMsg.includes('sensitive') || errorMsg.includes('flagged')) && model !== 'minimax/video-01') {
      console.warn(`[replicateService] E005 sensitive flag hit on ${model}. Automatically falling back to MiniMax Hailuo Video-01...`);
      try {
        const fallbackInput = {
          prompt: cleanPrompt,
          prompt_optimizer: true
        };
        if (cleanImageUrl) fallbackInput.first_frame_image = cleanImageUrl;
        const fallbackOutput = await replicate.run('minimax/video-01', { input: fallbackInput });
        const fallbackVideoUrl = extractMediaUrl(fallbackOutput);
        if (fallbackVideoUrl) {
          console.log(`[replicateService] Fallback to MiniMax succeeded: ${fallbackVideoUrl}`);
          return { video_url: fallbackVideoUrl };
        }
      } catch (fallbackErr) {
        console.error('[replicateService] Fallback to MiniMax also encountered error:', fallbackErr);
      }
    }
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

/**
 * Cancels an ongoing prediction
 */
async function cancelPrediction(predictionId) {
  try {
    if (!replicate || !predictionId) return null;
    const res = await replicate.predictions.cancel(predictionId);
    console.log(`[replicateService] Cancelled prediction ${predictionId}`);
    return res;
  } catch (error) {
    console.warn(`[replicateService] Could not cancel prediction ${predictionId}:`, error.message);
    return null;
  }
}

module.exports = {
  generateImage,
  generateVideo,
  generateCharacterSwapVideo,
  getPredictionStatus,
  cancelPrediction,
  extractMediaUrl,
  resolveReplicateModel,
  replicate
};
