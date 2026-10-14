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
  'seedance-2-0-fast': 'bytedance/seedance-2.5',
  'seedance-2-fast': 'bytedance/seedance-2.5',
  'seedance-2': 'bytedance/seedance-2.5',
  'seedance-2-i2v': 'bytedance/seedance-2.5',
  'bytedance/seedance-2.0/fast/text-to-video': 'bytedance/seedance-2.5',
  'bytedance/seedance-2.0/text-to-video': 'bytedance/seedance-2.5',
  'bytedance/seedance-2.0/image-to-video': 'bytedance/seedance-2.5',
  'bytedance/seedance-2.0': 'bytedance/seedance-2.5',
  'seedance-2-5': 'bytedance/seedance-2.5',
  'seedance-2.5': 'bytedance/seedance-2.5',
  'bytedance/seedance-2.5': 'bytedance/seedance-2.5'
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
  resolution = '720p',
  webhookUrl,
  generationId
}) {
  const resolved = resolveReplicateModel(endpoint, 'kwaivgi/kling-v3-omni-video');

  // Intelligent candidate list: user-selected engine first, then alternate engine for seamless resilience
  const candidates = [];
  if (resolved.includes('seedance')) {
    candidates.push('bytedance/seedance-2.5', 'kwaivgi/kling-v3-omni-video');
  } else {
    candidates.push('kwaivgi/kling-v3-omni-video', 'bytedance/seedance-2.5');
  }

  // Normalize characters list (supports both multi-character array and legacy single target_character)
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

  // Helper to translate @tag mentions and natural English into model-native syntax
  const translatePromptTags = (rawPrompt, isSeedance) => {
    if (!rawPrompt || !rawPrompt.trim()) return '';
    const { sanitizePromptForVideo } = require('./promptSanitizer');
    let p = sanitizePromptForVideo(rawPrompt);

    // 1. Video / Motion references: @Video1, @Motion1, video 1, video1, source video, etc.
    p = p.replace(/(?:@|\b)(?:source\s*video|video\s*1|video1|motion\s*1?)\b/gi, isSeedance ? '[Video1]' : '<<<video_1>>>');

    // 2. Image / Character / Person references: @Image1, image 1, character 1, person 1, etc.
    for (let i = 1; i <= 5; i++) {
      const charRegex = new RegExp(`(?:@|\\b)(?:image|char|character|person)\\s*${i}\\b`, 'gi');
      p = p.replace(charRegex, isSeedance ? `[Image${i}]` : `<<<image_${i}>>>`);
    }

    // 3. Fallback generic '@Video' / 'video'
    p = p.replace(/@Video\b/gi, isSeedance ? '[Video1]' : '<<<video_1>>>');
    // Generic '@Image'
    p = p.replace(/@Image\b/gi, isSeedance ? '[Image1]' : '<<<image_1>>>');

    // 4. Prop / Object references: @Prop, prop 1, object 1
    const propToken = isSeedance ? `[Image${propIndex}]` : `<<<image_${propIndex}>>>`;
    p = p.replace(/(?:@|\b)(?:prop|object)\s*([1-5]?)\b/gi, propToken);
    return p;
  };

  const buildPayloadForModel = (modelName) => {
    const input = {};
    if (modelName.includes('kling')) {
      // Kling v3 Omni Director (Verified 28 Sept ground-truth configuration)
      const userPromptClean = translatePromptTags(prompt, false);
      const isMotionOnly = userPromptClean.toLowerCase().includes('motion transfer') || userPromptClean.toLowerCase().includes('animate image');

      if (hasTargetPhotos) {
        input.prompt = userPromptClean
          ? `Exact character replacement of <<<video_1>>> with <<<image_1>>>, ${userPromptClean}, preserve original head orientation, precise facial anatomy matching, identical skin tone and facial structure, maintain exact choreography and camera motion of <<<video_1>>>, 8k photorealistic`
          : 'Exact character replacement of <<<video_1>>> with <<<image_1>>>, preserve original head orientation, precise facial anatomy matching, identical skin tone and facial structure, maintain exact choreography and camera motion of <<<video_1>>>, 8k photorealistic';
        input.reference_images = allReferenceImages.slice(0, 4);
      } else {
        input.prompt = userPromptClean || 'Transform the character in <<<video_1>>>, exact motion transfer, cinematic 8k photorealistic, match original choreography and camera movement';
        if (hasPropImage) {
          input.reference_images = allReferenceImages.slice(0, 4);
        }
      }
      if (source_video) {
        input.reference_video = source_video;
        input.video_reference_type = isMotionOnly ? 'feature' : 'base';
        input.keep_original_sound = true;
      }
      // Note: generate_audio is strictly omitted as it conflicts with reference_video on Kling
      input.mode = (resolution === '1080p') ? 'pro' : 'standard';
    } else {
      // Seedance 2.5
      const userPromptClean = translatePromptTags(prompt, true);
      input.prompt = userPromptClean || 'Replace person in [Video1] with [Image1], photorealistic motion transfer';
      if (hasTargetPhotos) input.reference_images = allReferenceImages;
      if (source_video) input.reference_videos = [source_video];
      input.resolution = '720p';
      input.duration = -1;
      input.aspect_ratio = 'adaptive';
    }
    return input;
  };

  let lastError = null;

  for (const modelToTry of candidates) {
    const input = buildPayloadForModel(modelToTry);
    const predictionPayload = {
      model: modelToTry,
      input
    };

    if (webhookUrl && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
      predictionPayload.webhook = `${webhookUrl}?generationId=${generationId}`;
      predictionPayload.webhook_events_filter = ['completed'];
    }

    // Try up to 2 attempts per model (handles transient 502 Cloudflare glitches)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[replicateService] Character Swap attempt ${attempt} on: ${modelToTry}`);
        console.log(`[replicateService] Source Video: ${source_video}`);
        console.log(`[replicateService] Target Characters (${validPhotos.length}):`, validPhotos.map(p => p.label || p.target_image_url));

        const prediction = await replicate.predictions.create(predictionPayload);
        console.log(`[replicateService] Created V2V prediction queue ID on ${modelToTry}: ${prediction.id}`);
        return { request_id: prediction.id, model_used: modelToTry };
      } catch (error) {
        lastError = error;
        const errMsg = String(error.message || '');
        const isTransientGateway = error.status === 502 || error.status === 503 || error.status === 504 || 
          errMsg.includes('502') || errMsg.includes('Bad Gateway') || errMsg.includes('503');

        console.warn(`[replicateService] Model ${modelToTry} attempt ${attempt} failed: ${errMsg}`);

        if (isTransientGateway && attempt === 1) {
          console.log('[replicateService] Gateway 502 encountered, backing off 1.5s before retry...');
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        break; // Move to next candidate model in fallback list
      }
    }
  }

  console.error('[replicateService] All character swap candidates exhausted. Last error:', lastError);
  throw new Error(lastError?.message || 'Character replacement API request failed after retry');
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
        input.duration = Math.max(3, Math.min(30, parsedDur));
      }
    }
    input.generate_audio = generate_audio !== false;
    if (cleanImageUrl) {
      input.image = cleanImageUrl;
      input.reference_images = [cleanImageUrl];
    }
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
