// server/routes/generate.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { generationLimiter } = require('../middleware/rateLimit');
const supabase = require('../lib/supabase');
const replicateService = require('../services/replicateService');
const creditService = require('../services/creditService');
const { createNotification } = require('../services/notificationService');
const { archiveVideo, archiveImage } = require('../services/storageService');
const { ensureCompatibleReferenceVideoUrl } = require('../services/videoProcessor');
const { enhanceAdPrompt, STYLE_PRESETS } = require('../services/promptEnhancer');
const { validatePromptSafety } = require('../lib/moderation');
const memoryCache = require('../lib/cache');

/**
 * POST /api/generate
 * Dispatches an asynchronous AI video generation job
 */
router.post('/', authMiddleware, generationLimiter, async (req, res) => {
  const {
    prompt,
    model_id,
    duration,
    resolution,
    aspect_ratio,
    generate_audio,
    image_url
  } = req.body;

  // 1. Inputs validation
  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a detailed prompt describing your video.' });
  }

  const safetyCheck = validatePromptSafety(prompt);
  if (!safetyCheck.allowed) {
    return res.status(400).json({ error: safetyCheck.reason });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompts cannot exceed 2000 characters.' });
  }

  if (!model_id) {
    return res.status(400).json({ error: 'Please select an AI video model.' });
  }

  const selectedDuration = parseInt(duration) || 10; // default 10 seconds
  const selectedAudio = generate_audio !== undefined ? !!generate_audio : true;

  try {
    // 2. Fetch model configuration to calculate exact cost
    const { data: model, error: modelErr } = await supabase
      .from('models')
      .select('*')
      .eq('id', model_id)
      .eq('is_active', true)
      .single();

    if (modelErr || !model) {
      return res.status(404).json({ error: 'Selected model is not active or unavailable.' });
    }

    // Assert inputs compatibility: Only enforce image requirement if the model is strictly an image-to-video animator
    if (model.id === 'seedance-2-i2v' && !image_url) {
      return res.status(400).json({ error: 'An input image URL is required for Image-to-Video animation.' });
    }

    const maxAllowedDuration = parseInt(model.max_duration, 10) || 10;
    if (selectedDuration > maxAllowedDuration) {
      return res.status(400).json({ error: `Selected duration exceeds ${model.name} maximum of ${maxAllowedDuration} seconds.` });
    }

    // Cost = duration * price_per_second
    const pricePerSec = parseFloat(model.price_per_second);
    const estimatedCost = selectedDuration * pricePerSec;

    // 3. Server-side credit check
    if (req.user.credits < estimatedCost) {
      return res.status(400).json({
        error: `Insufficient balance. Estimated cost is ₹${estimatedCost.toFixed(2)}, but you currently have ₹${req.user.credits.toFixed(2)} available.`
      });
    }

    // 4. Create generation record in DB with 'pending' status
    const defaultTitle = prompt.slice(0, 30).trim() + '...';
    const { data: generation, error: dbErr } = await supabase
      .from('generations')
      .insert({
        user_id: req.user.id,
        title: defaultTitle,
        prompt: prompt,
        model_id: model.id,
        model_name: model.name,
        status: 'pending',
        duration: selectedDuration,
        resolution: resolution || model.supported_resolutions?.[0] || '720p',
        aspect_ratio: aspect_ratio || model.supported_aspects?.[0] || '16:9',
        cost: estimatedCost,
        is_public: false
      })
      .select()
      .single();

    if (dbErr || !generation) {
      throw new Error(`Failed to initialize generation: ${dbErr?.message}`);
    }

    // 5. Deduct cost immediately to prevent double spending
    await creditService.deductCredits(
      req.user.id,
      estimatedCost,
      `AI Video Generation: ${model.name} (${selectedDuration}s)`,
      generation.id
    );

    // 6. Return response immediately with record ID
    res.status(202).json({
      success: true,
      message: 'Generation initiated successfully.',
      generationId: generation.id,
      estimatedCost
    });

    // 7. Dispatch Replicate Generation in the background
    (async () => {
      try {
        // Update status to 'processing'
        await supabase
          .from('generations')
          .update({ status: 'processing' })
          .eq('id', generation.id);

        console.log(`[BackgroundWorker] Executing Replicate job for gen: ${generation.id}`);

        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
        const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || vercelUrl || process.env.API_URL || 'http://localhost:5000'}/api/generate/webhook`;

        const result = await replicateService.generateVideo({
          endpoint: model.fal_endpoint,
          prompt: prompt,
          duration: selectedDuration,
          resolution: resolution || model.supported_resolutions?.[0],
          aspect_ratio: aspect_ratio || model.supported_aspects?.[0],
          generate_audio: selectedAudio,
          image_url: image_url,
          webhookUrl,
          generationId: generation.id
        });

        if (result.request_id) {
          // Store prediction ID in DB to track it
          await supabase
            .from('generations')
            .update({ fal_request_id: result.request_id })
            .eq('id', generation.id);

          // Local webhook simulation / polling
          const isLocalhost = webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1');
          if (isLocalhost) {
            console.log(`[BackgroundWorker] Localhost environment detected. Initiating background prediction polling for: ${result.request_id}`);
            (async () => {
              try {
                let status = 'starting';
                let currentResult = null;

                // Poll status every 3 seconds up to 100 times (5 minutes limit)
                for (let attempt = 0; attempt < 100; attempt++) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  currentResult = await replicateService.getPredictionStatus(result.request_id);
                  status = currentResult.status;

                  if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
                    break;
                  }
                }

                if (status === 'succeeded') {
                  console.log(`[BackgroundWorker] Local poll completed successfully for: ${generation.id}`);
                  await handleWebhookLogic(generation.id, 'OK', currentResult.output, null);
                } else {
                  console.error(`[BackgroundWorker] Local poll failed/timed out for: ${generation.id}. Status: ${status}`);
                  await handleWebhookLogic(generation.id, 'ERROR', null, currentResult?.error || 'Replicate polling timeout or failed');
                }
              } catch (pollErr) {
                console.error(`[BackgroundWorker] Local poll critical error for: ${generation.id}`, pollErr);
                await handleWebhookLogic(generation.id, 'ERROR', null, pollErr.message);
              }
            })();
          }
        } else if (result.video_url) {
          // Synchronous fallback success - mark completed immediately
          console.log(`[BackgroundWorker] Synchronous result returned. Updating generation ${generation.id} to completed.`);
          const placeholderThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';

          const { error: updErr } = await supabase
            .from('generations')
            .update({
              status: 'completed',
              video_url: result.video_url,
              thumbnail_url: placeholderThumbnail
            })
            .eq('id', generation.id);

          if (updErr) {
            console.error(`[BackgroundWorker] Database update failed for ${generation.id}:`, updErr);
          }

          await createNotification(
            req.user.id,
            'Video Ready! 🎬',
            `Your video generation with "${model.name}" has completed successfully.`,
            'success'
          );

          // Archive permanently to Supabase Storage in the background
          archiveVideo(result.video_url, req.user.id, generation.id)
            .then(async (permanentVideoUrl) => {
              if (permanentVideoUrl && permanentVideoUrl !== result.video_url) {
                await supabase.from('generations').update({ video_url: permanentVideoUrl }).eq('id', generation.id);
              }
            })
            .catch(err => console.warn('[BackgroundWorker] Archiving video warning:', err.message));
        }

      } catch (err) {
        console.error(`[BackgroundWorker] Generation failed for: ${generation.id}`, err);

        // Refund user balances atomically on failure
        try {
          await creditService.addCredits(
            req.user.id,
            parseFloat(estimatedCost),
            `Refund for failed generation ${generation.id}`,
            `refund-${generation.id}`,
            `refund-${generation.id}`,
            'refund'
          );

          console.log(`[BackgroundWorker] Successfully refunded ₹${estimatedCost} to user: ${req.user.id}`);
        } catch (refundErr) {
          console.error('[BackgroundWorker] Refund critical error:', refundErr);
        }

        // Set DB status to failed
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: err.message || 'Replicate execution error/timeout.'
          })
          .eq('id', generation.id);

        // Notify user about error
        await createNotification(
          req.user.id,
          'Generation Failed ❌',
          `Unable to complete video: ${err.message || 'API error.'}. Credits refunded.`,
          'error'
        );
      }
    })();

  } catch (err) {
    console.error('Express generation controller error:', err);
    res.status(500).json({ error: err.message || 'Generation request dispatcher failed.' });
  }
});

/**
 * POST /api/generate/image
 * Synchronous image generation via fal.ai (Flux Schnell / Flux Dev).
 * Uses fixed base_cost from model — no duration needed.
 */
router.post('/image', authMiddleware, generationLimiter, async (req, res) => {
  req.setTimeout(180000); // 3 minutes timeout to allow diffusion GPU rendering
  res.setTimeout(180000);

  const { prompt, model_id, aspect_ratio = '1:1', input_image = null } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a prompt describing your image.' });
  }

  const safetyCheck = validatePromptSafety(prompt);
  if (!safetyCheck.allowed) {
    return res.status(400).json({ error: safetyCheck.reason });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompts cannot exceed 2000 characters.' });
  }
  if (!model_id) {
    return res.status(400).json({ error: 'Please select an image generation model.' });
  }

  try {
    // 1. Fetch model (must be type 'image')
    const { data: model, error: modelErr } = await supabase
      .from('models')
      .select('*')
      .eq('id', model_id)
      .eq('is_active', true)
      .eq('model_type', 'image')
      .single();

    if (modelErr || !model) {
      return res.status(404).json({ error: 'Selected image model is not available.' });
    }

    const cost = parseFloat(model.base_cost || 0);

    // 2. Credit check
    if (req.user.credits < cost) {
      return res.status(400).json({
        error: `Insufficient balance. This model costs ₹${cost.toFixed(2)}, but you currently have ₹${req.user.credits.toFixed(2)} available.`
      });
    }

    // 3. Map aspect_ratio to image_size param
    const sizeMap = { '1:1': 'square_hd', '4:3': 'landscape_4_3', '3:4': 'portrait_4_3', '16:9': 'landscape_16_9', '9:16': 'portrait_16_9' };
    const image_size = sizeMap[aspect_ratio] || 'landscape_4_3';

    // 4. Create generation record with schema-safe resilient fallback
    const defaultTitle = prompt.slice(0, 30).trim() + '...';
    const insertPayload = {
      user_id: req.user.id,
      title: defaultTitle,
      prompt,
      model_id: model.id,
      model_name: model.name,
      status: 'processing',
      duration: 0,
      resolution: image_size,
      aspect_ratio,
      cost,
      generation_type: 'image',
      input_image_url: input_image || null,
      is_public: false
    };

    let { data: generation, error: dbErr } = await supabase
      .from('generations')
      .insert(insertPayload)
      .select()
      .single();

    if (dbErr && (dbErr.message.includes('schema cache') || dbErr.message.includes('column'))) {
      console.warn('[ImageGeneration] Missing input_image_url in schema cache, retrying:', dbErr.message);
      delete insertPayload.input_image_url;
      const retryResult = await supabase
        .from('generations')
        .insert(insertPayload)
        .select()
        .single();
      generation = retryResult.data;
      dbErr = retryResult.error;
    }

    if (dbErr || !generation) {
      throw new Error(`Failed to initialize generation: ${dbErr?.message}`);
    }

    // 5. Deduct credits immediately
    await creditService.deductCredits(
      req.user.id,
      cost,
      `AI Image Generation: ${model.name}`,
      generation.id
    );

    // 6. Call Replicate synchronously
    let imageResult;
    try {
      imageResult = await replicateService.generateImage({
        endpoint: model.fal_endpoint,
        prompt,
        aspect_ratio,
        input_image
      });
    } catch (repErr) {
      // Refund on Replicate failure
      await creditService.addCredits(
        req.user.id,
        cost,
        `Refund for failed image generation ${generation.id}`,
        `refund-${generation.id}`,
        `refund-${generation.id}`,
        'refund'
      );
      await supabase.from('generations').update({ status: 'failed', error_message: repErr.message }).eq('id', generation.id);
      throw repErr;
    }

    // 7. Mark generation completed immediately with generated image URL
    const { error: imgUpdErr } = await supabase.from('generations').update({
      status: 'completed',
      video_url: imageResult.image_url,
      thumbnail_url: imageResult.image_url
    }).eq('id', generation.id);

    if (imgUpdErr) {
      console.error(`[ImageHandler] Error updating generation ${generation.id}:`, imgUpdErr);
    }

    await createNotification(req.user.id, 'Image Ready! 🖼️', `Your image from "${model.name}" is ready.`, 'success');

    // Archive image asynchronously in background
    archiveImage(imageResult.image_url, req.user.id, generation.id)
      .then(async (permanentImageUrl) => {
        if (permanentImageUrl && permanentImageUrl !== imageResult.image_url) {
          await supabase.from('generations').update({
            video_url: permanentImageUrl,
            thumbnail_url: permanentImageUrl
          }).eq('id', generation.id);
        }
      })
      .catch(err => console.warn('[ImageHandler] Non-critical image archive warning:', err.message));

    // 8. Respond synchronously (no polling needed)
    res.status(200).json({
      success: true,
      generationId: generation.id,
      image_url: imageResult.image_url,
      cost
    });

  } catch (err) {
    console.error('[generate/image] Error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed.' });
  }
});

/**
 * POST /api/generate/swap (and alias /api/generate/character-swap)
 * Character Replacement / Video-to-Video Motion Transfer Pipeline
 * Uploads reference source video + target character reference
 */
router.post(['/swap', '/character-swap'], authMiddleware, generationLimiter, async (req, res) => {
  const {
    source_video_url,
    target_character_url,
    characters = [],
    prop_image_url,
    prompt,
    model_id,
    duration,
    aspect_ratio
  } = req.body;

  if (!source_video_url) {
    return res.status(400).json({ error: 'Source motion video is required for character replacement.' });
  }

  // Normalize multi-character list
  let normalizedCharacters = Array.isArray(characters) && characters.length > 0 ? characters : [];
  if (normalizedCharacters.length === 0 && target_character_url) {
    normalizedCharacters = [{ target_image_url: target_character_url, label: '' }];
  }
  const primaryCharacterUrl = normalizedCharacters[0]?.target_image_url || target_character_url || null;

  if (!primaryCharacterUrl && (!prompt || prompt.trim().length === 0)) {
    return res.status(400).json({ error: 'Please provide at least one target character image or a detailed character prompt.' });
  }

  if (prompt) {
    const safetyCheck = validatePromptSafety(prompt);
    if (!safetyCheck.allowed) {
      return res.status(400).json({ error: safetyCheck.reason });
    }
  }

  const selectedDuration = Math.max(3, Math.min(10, parseInt(duration) || 10));
  const targetModelId = model_id || 'kling-3-omni';

  try {
    // 1. Fetch model configuration
    let { data: model, error: modelErr } = await supabase
      .from('models')
      .select('*')
      .eq('id', targetModelId)
      .eq('is_active', true)
      .single();

    // Fallback if specific model is inactive
    if (modelErr || !model) {
      const { data: fallbackModel } = await supabase
        .from('models')
        .select('*')
        .eq('model_type', 'video')
        .eq('is_active', true)
        .order('price_per_second', { ascending: true })
        .limit(1)
        .single();
      model = fallbackModel;
    }

    if (!model) {
      return res.status(404).json({ error: 'No compatible video engine available for character swap.' });
    }

    // Cost calculation: duration * price_per_second
    const pricePerSec = parseFloat(model.price_per_second || 2.5);
    const estimatedCost = selectedDuration * pricePerSec;

    // 2. Balance check
    if (req.user.credits < estimatedCost) {
      return res.status(400).json({
        error: `Insufficient balance. Estimated cost is ₹${estimatedCost.toFixed(2)}, but you currently have ₹${req.user.credits.toFixed(2)} available.`
      });
    }

    // 3. Insert record into generations with schema-safe resilient fallback
    const charCount = normalizedCharacters.length;
    const displayTitle = prompt && prompt.trim() 
      ? `Character Swap (${charCount > 1 ? `${charCount} chars` : '1 char'}): ${prompt.slice(0, 25).trim()}...` 
      : `Character Replacement (${charCount > 1 ? `${charCount} chars` : '1 char'})`;

    const insertPayload = {
      user_id: req.user.id,
      title: displayTitle,
      prompt: prompt || 'Character replacement motion transfer',
      model_id: model.id,
      model_name: model.name,
      status: 'pending',
      duration: selectedDuration,
      resolution: '720p',
      aspect_ratio: aspect_ratio || '16:9',
      cost: estimatedCost,
      generation_type: 'video', // Strictly satisfies PostgreSQL CHECK (generation_type IN ('video', 'image'))
      is_public: false
    };

    const { data: generation, error: dbErr } = await supabase
      .from('generations')
      .insert(insertPayload)
      .select()
      .single();

    if (dbErr || !generation) {
      console.error('[CharacterSwap] Insert failed:', dbErr);
      throw new Error(`Failed to initialize character swap generation: ${dbErr?.message}`);
    }

    // 4. Deduct cost immediately
    await creditService.deductCredits(
      req.user.id,
      estimatedCost,
      `Character Replacement Video: ${model.name} (${selectedDuration}s)`,
      generation.id
    );

    // Cache swap assets in memory with 2-hour TTL for failover resilience
    memoryCache.set(`swap_assets_${generation.id}`, {
      source_video_url,
      primaryCharacterUrl,
      normalizedCharacters,
      prop_image_url
    }, 7200);

    // 5. Send early response to client
    res.status(202).json({
      success: true,
      message: 'Character swap generation initiated successfully.',
      generationId: generation.id,
      estimatedCost
    });

    // 6. Background async processing
    (async () => {
      try {
        await supabase
          .from('generations')
          .update({ status: 'processing' })
          .eq('id', generation.id);

        const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
        const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || vercelUrl || process.env.API_URL || 'http://localhost:5000'}/api/generate/webhook`;

        // Auto-conform and ensure source video meets AI provider HD & duration specs
        let readyVideoUrl = source_video_url;
        try {
          const { ensureCompatibleReferenceVideoUrl } = require('../services/videoProcessor');
          // 45s timeout race so video conformance can reliably finish
          readyVideoUrl = await Promise.race([
            ensureCompatibleReferenceVideoUrl(source_video_url, req.user.id, supabase, model.id || model.fal_endpoint),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Conformance check timed out')), 45000))
          ]);
          console.log(`[CharacterSwap] Using verified reference video URL: ${readyVideoUrl}`);
        } catch (vProcErr) {
          console.warn('[CharacterSwap] Video processor warning, using source URL:', vProcErr.message);
          readyVideoUrl = source_video_url;
        }

        const result = await replicateService.generateCharacterSwapVideo({
          endpoint: model.fal_endpoint,
          source_video: readyVideoUrl,
          target_character: primaryCharacterUrl,
          characters: normalizedCharacters,
          prop_image: prop_image_url,
          prompt,
          aspect_ratio: aspect_ratio || '16:9',
          resolution: generation.resolution || '720p',
          webhookUrl,
          generationId: generation.id
        });

        if (result.request_id) {
          const updatePayload = { fal_request_id: result.request_id };
          if (result.model_used) updatePayload.model_name = result.model_used;
          await supabase
            .from('generations')
            .update(updatePayload)
            .eq('id', generation.id);

          // Background prediction tracking (runs on both localhost and production as webhook fallback)
          console.log(`[CharacterSwap] Initiating background prediction tracking for: ${result.request_id}`);
          (async () => {
            try {
              let status = 'starting';
              let currentResult = null;

              // Poll status every 4 seconds up to 120 times (8 minutes limit)
              for (let attempt = 0; attempt < 120; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 4000));
                currentResult = await replicateService.getPredictionStatus(result.request_id);
                status = currentResult.status;

                if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
                  break;
                }
              }

              if (status === 'succeeded') {
                console.log(`[CharacterSwap] Background tracking completed successfully for: ${generation.id}`);
                await handleWebhookLogic(generation.id, 'OK', currentResult.output, null);
              } else if (status === 'failed' || status === 'canceled') {
                console.error(`[CharacterSwap] Background tracking prediction ended with ${status} for: ${generation.id}`);
                await handleWebhookLogic(generation.id, 'ERROR', null, currentResult?.error || 'Replicate prediction failed');
              }
            } catch (pollErr) {
              console.error(`[CharacterSwap] Tracking error for: ${generation.id}`, pollErr.message);
            }
          })();
        } else if (result.video_url) {
          const placeholderThumb = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';
          await supabase
            .from('generations')
            .update({
              status: 'completed',
              video_url: result.video_url,
              thumbnail_url: placeholderThumb
            })
            .eq('id', generation.id);

          await createNotification(
            req.user.id,
            'Character Swap Ready! 🎭',
            `Your character replacement video with "${model.name}" has completed successfully.`,
            'success'
          );

          // Archive final output permanently in 'videos' bucket
          archiveVideo(result.video_url, req.user.id, generation.id)
            .then(async (permanentVideoUrl) => {
              if (permanentVideoUrl && permanentVideoUrl !== result.video_url) {
                await supabase.from('generations').update({ video_url: permanentVideoUrl }).eq('id', generation.id);
              }
            })
            .catch(err => console.warn('[CharacterSwap] Archiving video warning:', err.message));
        }
      } catch (err) {
        console.error(`[CharacterSwap] Generation failed for: ${generation.id}`, err);

        // Refund atomically on failure
        try {
          await creditService.addCredits(
            req.user.id,
            parseFloat(estimatedCost),
            `Refund for failed character swap ${generation.id}`,
            `refund-${generation.id}`,
            `refund-${generation.id}`,
            'refund'
          );
          console.log(`[CharacterSwap] Successfully refunded ₹${estimatedCost} to user: ${req.user.id}`);
        } catch (refundErr) {
          console.error('[CharacterSwap] Refund critical error:', refundErr);
        }

        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: err.message || 'Character replacement execution error.'
          })
          .eq('id', generation.id);

        await createNotification(
          req.user.id,
          'Character Swap Failed ❌',
          `Unable to complete character replacement: ${err.message || 'API error.'}. Credits refunded.`,
          'error'
        );
      }
    })();

  } catch (err) {
    console.error('Express character swap controller error:', err);
    res.status(500).json({ error: err.message || 'Character swap dispatcher failed.' });
  }
});

/**
 * GET /api/generate
 * Returns authenticated user's generation list (paginated)
 */
router.get('/', authMiddleware, async (req, res) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;

    let query = supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    // Filter out failed attempts from user's creations list
    if (req.query.include_failed !== 'true') {
      query = query.neq('status', 'failed');
    }

    const { data: gens, error, count } = await query
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    if (error) throw error;

    // Check if user is a free tier user (no 'purchase' transactions in logs)
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      generations: gens,
      watermarkRequired,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Failed to list generations:', err);
    res.status(500).json({ error: 'Failed to retrieve videos.' });
  }
});

const activeWebhookProcessing = new Set();

/**
 * Shared logic to process generation webhooks and development-mode queue polling results
 */
async function handleWebhookLogic(generationId, status, payload, errorMsg) {
  if (!generationId) return;

  if (activeWebhookProcessing.has(generationId)) {
    console.log(`[WebhookLogic] Generation ${generationId} is already actively being processed. Skipping concurrent call.`);
    return;
  }
  activeWebhookProcessing.add(generationId);

  try {
    const { data: gen } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (!gen) {
      console.error(`[WebhookLogic] Generation record ${generationId} not found.`);
      return;
    }

    // Guard to prevent double processing
    if (gen.status === 'completed' || gen.status === 'failed') {
      console.log(`[WebhookLogic] Generation ${generationId} is already: ${gen.status}. Skipping.`);
      return;
    }

    const isSuccess = status === 'OK' || status === 'succeeded';

    if (isSuccess) {
      const originalMediaUrl = replicateService.extractMediaUrl(payload) || payload?.video?.url || payload?.file?.url || payload?.outputs?.[0]?.url;
      const placeholderThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';

      if (!originalMediaUrl) {
        throw new Error('No valid media URL returned from Replicate.');
      }

      // Mark completed immediately so frontend and user can view/play right away
      const { error: webUpdErr } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          video_url: originalMediaUrl,
          thumbnail_url: placeholderThumbnail
        })
        .eq('id', generationId);

      if (webUpdErr) {
        console.error(`[WebhookLogic] Failed to mark completed for ${generationId}:`, webUpdErr);
      }

      await createNotification(
        gen.user_id,
        'Video Ready! 🎬',
        `Your video generation with "${gen.model_name}" has completed successfully.`,
        'success'
      );

      // Archive video permanently in the background
      archiveVideo(originalMediaUrl, gen.user_id, gen.id)
        .then(async (permanentVideoUrl) => {
          if (permanentVideoUrl && permanentVideoUrl !== originalMediaUrl) {
            await supabase.from('generations').update({ video_url: permanentVideoUrl }).eq('id', generationId);
          }
        })
        .catch(err => console.warn('[WebhookLogic] Background archiving warning:', err.message));
      
      try {
        const { sendVideoReadyEmail } = require('../services/emailService');
        const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', gen.user_id).single();
        if (userProfile && userProfile.email) {
           await sendVideoReadyEmail(userProfile.email, gen.title);
        }
      } catch (emailErr) {
        console.error('[WebhookLogic] Non-critical email send failed:', emailErr);
      }
    } else {
      const isSensitiveOrE005 = typeof errorMsg === 'string' && (
        errorMsg.includes('E005') ||
        errorMsg.toLowerCase().includes('sensitive') ||
        errorMsg.toLowerCase().includes('flagged')
      );

      // Auto-fallback: if Kling or Seedance triggered E005, retry with MiniMax Hailuo Video-01 (text-to-video only, never for character swap)
      if (gen.generation_type !== 'swap' && isSensitiveOrE005 && gen.model_id !== 'minimax-hailuo' && !gen.error_message?.includes('[fallback-attempted]')) {
        console.log(`[WebhookLogic] Upstream E005 moderation detected for gen ${generationId}. Retrying with MiniMax Hailuo Video-01...`);
        try {
          await supabase.from('generations').update({
            model_id: 'minimax-hailuo',
            model_name: 'MiniMax Hailuo Video-01 (Auto-Protected)',
            error_message: '[fallback-attempted] Retrying with permissive AI engine'
          }).eq('id', generationId);

          const { extractVisualScenePrompt } = require('../services/promptSanitizer');
          const cleanVisualPrompt = extractVisualScenePrompt(gen.prompt);

          const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
          const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || vercelUrl || process.env.API_URL || 'http://localhost:5000'}/api/generate/webhook`;

          const fallbackResult = await replicateService.generateVideo({
            endpoint: 'minimax/video-01',
            prompt: cleanVisualPrompt,
            duration: gen.duration || 6,
            resolution: gen.resolution || '720p',
            aspect_ratio: gen.aspect_ratio || '16:9',
            generate_audio: true,
            webhookUrl,
            generationId: gen.id
          });

          if (fallbackResult.request_id) {
            await supabase.from('generations').update({ fal_request_id: fallbackResult.request_id }).eq('id', gen.id);
            console.log(`[WebhookLogic] Fallback prediction queued on MiniMax: ${fallbackResult.request_id}`);

            (async () => {
              try {
                let mStatus = 'starting';
                let mResult = null;
                for (let attempt = 0; attempt < 120; attempt++) {
                  await new Promise(r => setTimeout(r, 4000));
                  mResult = await replicateService.getPredictionStatus(fallbackResult.request_id);
                  mStatus = mResult.status;
                  if (mStatus === 'succeeded' || mStatus === 'failed' || mStatus === 'canceled') break;
                }
                if (mStatus === 'succeeded') {
                  await handleWebhookLogic(gen.id, 'OK', mResult.output, null);
                } else if (mStatus === 'failed' || mStatus === 'canceled') {
                  await handleWebhookLogic(gen.id, 'ERROR', null, mResult?.error || 'MiniMax fallback prediction failed');
                }
              } catch (mErr) {
                console.error(`[WebhookLogic] Tracking error for MiniMax fallback ${fallbackResult.request_id}:`, mErr.message);
              }
            })();

            return;
          } else if (fallbackResult.video_url) {
            await handleWebhookLogic(gen.id, 'OK', fallbackResult.video_url, null);
            return;
          }
        } catch (fallbackErr) {
          console.error('[WebhookLogic] Fallback to MiniMax also failed:', fallbackErr);
        }
      }

      // Auto-fallback for character swap: if Seedance 2.5 fails, automatically retry on Kling 3.0 Omni (or vice versa)
      if (gen.generation_type === 'swap' && !gen.error_message?.includes('[swap-fallback-attempted]')) {
        const currentModel = String(gen.model_name || gen.model_id || '').toLowerCase();
        const fallbackTarget = currentModel.includes('seedance')
          ? 'kwaivgi/kling-v3-omni-video'
          : 'bytedance/seedance-2.5';
        const fallbackDisplayName = fallbackTarget.includes('kling') ? 'Kling 3.0 Omni (Auto-Protected)' : 'Seedance 2.5 (Auto-Protected)';

        console.log(`[WebhookLogic] Character swap attempt on ${currentModel} failed (${errorMsg}). Retrying with alternate engine ${fallbackTarget}...`);
        try {
          await supabase.from('generations').update({
            model_id: fallbackTarget.includes('kling') ? 'kling-3-omni' : 'seedance-2.5',
            model_name: fallbackDisplayName,
            error_message: `[swap-fallback-attempted] Retrying on ${fallbackDisplayName}`
          }).eq('id', generationId);

          const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
          const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || vercelUrl || process.env.API_URL || 'http://localhost:5000'}/api/generate/webhook`;

          const cachedAssets = memoryCache.get(`swap_assets_${generationId}`) || {};
          let videoUrlToUse = cachedAssets.source_video_url || gen.source_video_url;
          const targetCharToUse = cachedAssets.primaryCharacterUrl || gen.input_image_url;
          const charactersToUse = (cachedAssets.normalizedCharacters && cachedAssets.normalizedCharacters.length > 0)
            ? cachedAssets.normalizedCharacters
            : (gen.characters || []);

          try {
            const { ensureCompatibleReferenceVideoUrl } = require('../services/videoProcessor');
            videoUrlToUse = await ensureCompatibleReferenceVideoUrl(videoUrlToUse, gen.user_id, supabase, fallbackTarget);
          } catch (vpErr) {
            console.warn('[WebhookLogic] Conformance check skipped:', vpErr.message);
          }

          const fallbackResult = await replicateService.generateCharacterSwapVideo({
            endpoint: fallbackTarget,
            source_video: videoUrlToUse,
            target_character: targetCharToUse,
            characters: charactersToUse,
            prop_image: cachedAssets.prop_image_url,
            prompt: gen.prompt,
            aspect_ratio: gen.aspect_ratio || '16:9',
            resolution: gen.resolution || '720p',
            webhookUrl,
            generationId: gen.id
          });

          if (fallbackResult.request_id) {
            await supabase.from('generations').update({
              fal_request_id: fallbackResult.request_id,
              model_name: fallbackResult.model_used || fallbackDisplayName
            }).eq('id', gen.id);
            console.log(`[WebhookLogic] Swap fallback prediction queued on ${fallbackTarget}: ${fallbackResult.request_id}`);

            (async () => {
              try {
                let fStatus = 'starting';
                let fResult = null;
                for (let attempt = 0; attempt < 120; attempt++) {
                  await new Promise(r => setTimeout(r, 4000));
                  fResult = await replicateService.getPredictionStatus(fallbackResult.request_id);
                  fStatus = fResult.status;
                  if (fStatus === 'succeeded' || fStatus === 'failed' || fStatus === 'canceled') break;
                }
                if (fStatus === 'succeeded') {
                  await handleWebhookLogic(gen.id, 'OK', fResult.output, null);
                } else if (fStatus === 'failed' || fStatus === 'canceled') {
                  await handleWebhookLogic(gen.id, 'ERROR', null, fResult?.error || 'Fallback prediction failed');
                }
              } catch (fErr) {
                console.error(`[WebhookLogic] Tracking error for swap fallback ${fallbackResult.request_id}:`, fErr.message);
              }
            })();

            return;
          } else if (fallbackResult.video_url) {
            await handleWebhookLogic(gen.id, 'OK', fallbackResult.video_url, null);
            return;
          }
        } catch (swapFallbackErr) {
          console.error('[WebhookLogic] Swap fallback attempt encountered error:', swapFallbackErr);
        }
      }

      // Refund credits atomically
      await creditService.addCredits(
        gen.user_id,
        parseFloat(gen.cost),
        `Refund for failed generation ${generationId}`,
        `refund-${generationId}`,
        `refund-${generationId}`,
        'refund'
      );

      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: errorMsg || 'Generation failed on Replicate'
        })
        .eq('id', generationId);

      await createNotification(
        gen.user_id,
        'Generation Failed ❌',
        `Unable to complete video. Credits refunded.`,
        'error'
      );
    }
  } catch (err) {
    console.error(`[WebhookLogic] Exception during webhook execution for ${generationId}:`, err);
    throw err;
  } finally {
    activeWebhookProcessing.delete(generationId);
  }
}

/**
 * POST /api/generate/webhook
 * Replicate calls this when generation is complete
 */
router.post('/webhook', async (req, res) => {
  try {
    const { generationId } = req.query;
    
    if (!generationId) return res.status(400).send('No generationId');

    // Handle both Replicate webhook payload format and legacy payload format
    const isReplicate = !!req.body.id && typeof req.body.status === 'string';
    const status = isReplicate 
      ? (req.body.status === 'succeeded' ? 'OK' : 'ERROR')
      : (req.body.status || 'OK');
    const payload = isReplicate ? req.body.output : req.body.payload;
    const error = isReplicate ? req.body.error : req.body.error;

    await handleWebhookLogic(generationId, status, payload, error);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /api/generate/:id/status
 * Polling endpoint for single generation status updates
 */
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    let { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation record not found.' });
    }

    // Proactive sync: if generation is still pending/processing and has a provider prediction ID, check status
    if ((gen.status === 'processing' || gen.status === 'pending') && gen.fal_request_id) {
      try {
        const pred = await replicateService.getPredictionStatus(gen.fal_request_id);
        if (pred && (pred.status === 'succeeded' || pred.status === 'failed' || pred.status === 'canceled')) {
          // Trigger webhook logic in background WITHOUT blocking the polling HTTP response
          handleWebhookLogic(
            gen.id,
            pred.status === 'succeeded' ? 'OK' : 'ERROR',
            pred.output,
            pred.error || 'Prediction finished with failure'
          ).catch(e => console.warn('[StatusPolling] Background sync notice:', e.message));

          if (pred.status === 'succeeded') {
            gen.status = 'completed';
            const mediaUrl = replicateService.extractMediaUrl(pred.output);
            if (mediaUrl) gen.video_url = mediaUrl;
          } else if (pred.status === 'failed') {
            if (gen.generation_type === 'swap' && !gen.error_message?.includes('[swap-fallback-attempted]')) {
              gen.status = 'processing';
            } else {
              gen.status = 'failed';
              gen.error_message = pred.error || 'Prediction finished with failure';
            }
          }
        }
      } catch (checkErr) {
        // Silently continue serving current DB record if provider status check is transiently unavailable
      }
    }

    // Dynamic watermark check
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      id: gen.id,
      status: gen.status,
      video_url: gen.video_url,
      thumbnail_url: gen.thumbnail_url,
      error_message: gen.error_message,
      cost: gen.cost,
      watermarkRequired
    });
  } catch (err) {
    console.error('Status polling error:', err);
    res.status(500).json({ error: 'Polling error occurred.' });
  }
});

/**
 * POST /api/generate/:id/cancel
 * Cancels an ongoing generation (video/swap/image), marks it failed/cancelled, and refunds credits.
 */
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch generation record for this user
    const { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Generation record not found or access denied.' });
    }

    // 2. Check if already completed
    if (gen.status === 'completed') {
      return res.status(400).json({ error: 'Generation has already finished and cannot be cancelled.' });
    }

    if (gen.status === 'failed') {
      return res.json({ success: true, message: 'Generation has already ended.', status: gen.status });
    }

    // 3. If Replicate prediction ID exists, attempt Replicate API cancellation
    if (gen.fal_request_id) {
      try {
        await replicateService.cancelPrediction(gen.fal_request_id);
      } catch (err) {
        console.warn(`[Cancel] Failed to cancel Replicate task ${gen.fal_request_id}:`, err.message);
      }
    }

    // 4. Update generation record in Supabase
    const { error: updateErr } = await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Generation cancelled by user.'
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[Cancel] DB update error:', updateErr);
    }

    // 5. Refund credits atomically
    const refundCost = parseFloat(gen.cost || 0);
    if (refundCost > 0) {
      try {
        await creditService.addCredits(
          req.user.id,
          refundCost,
          `Refund for cancelled generation ${gen.id}`,
          `cancel-${gen.id}`,
          `cancel-${gen.id}`,
          'refund'
        );
        console.log(`[Cancel] Successfully refunded ₹${refundCost} to user ${req.user.id}`);
      } catch (refundErr) {
        console.error('[Cancel] Error refunding credits:', refundErr);
      }
    }

    // 6. Create notification for user
    try {
      await createNotification(
        req.user.id,
        'Generation Cancelled ⏹️',
        `Generation "${gen.title || 'Video'}" was cancelled. ₹${refundCost.toFixed(2)} refunded to your balance.`,
        'info'
      );
    } catch (notifErr) {
      console.warn('[Cancel] Notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: 'Generation successfully cancelled. Credits have been refunded.',
      refundedCost: refundCost,
      id
    });
  } catch (err) {
    console.error('[Cancel] Controller error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel generation.' });
  }
});

/**
 * GET /api/generate/:id
 * Retrieve full metadata for a single video
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation record not found.' });
    }

    // Check watermark
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
      ...gen,
      watermarkRequired
    });
  } catch (err) {
    console.error('Failed to get video detail:', err);
    res.status(500).json({ error: 'Failed to retrieve video details.' });
  }
});

/**
 * PATCH /api/generate/:id
 * Updates video details (e.g. custom renaming or public gallery status)
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, is_public, thumbnail_url } = req.body;
  const updates = {};
  
  if (title !== undefined) updates.title = title;
  if (is_public !== undefined) updates.is_public = !!is_public;
  if (thumbnail_url !== undefined && typeof thumbnail_url === 'string') updates.thumbnail_url = thumbnail_url;

  try {
    const { data: gen, error } = await supabase
      .from('generations')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation not found or modification denied.' });
    }

    res.json(gen);
  } catch (err) {
    console.error('Update video configuration failed:', err);
    res.status(500).json({ error: 'Failed to save modifications.' });
  }
});

/**
 * DELETE /api/generate/:id
 * Deletes generation records from Supabase DB
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: gen } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!gen) {
      return res.status(404).json({ error: 'Generation not found or access denied.' });
    }

    // If generation is currently in-flight, cancel Replicate task and refund credits
    if (gen.status === 'processing' || gen.status === 'pending') {
      if (gen.fal_request_id) {
        try {
          await replicateService.cancelPrediction(gen.fal_request_id);
        } catch (repErr) {
          console.warn(`[Delete/Cancel] Could not cancel Replicate prediction ${gen.fal_request_id}:`, repErr.message);
        }
      }
      const refundCost = parseFloat(gen.cost || 0);
      if (refundCost > 0) {
        try {
          await creditService.addCredits(
            req.user.id,
            refundCost,
            `Refund for deleted generation ${gen.id}`,
            `delete-refund-${gen.id}`,
            `delete-refund-${gen.id}`,
            'refund'
          );
        } catch (credErr) {
          console.warn('[Delete/Cancel] Credit refund error:', credErr.message);
        }
      }
    }

    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete generation:', err);
    res.status(500).json({ error: 'Failed to remove generation.' });
  }
});

/**
 * POST /api/generate/enhance-prompt
 * Transforms a basic user prompt into an agency-grade commercial ad creative prompt
 */
router.post('/enhance-prompt', authMiddleware, async (req, res) => {
  try {
    const { prompt, style = 'ad-commercial', mode = 'video' } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Please enter a prompt idea to enhance.' });
    }

    const enhancedPrompt = enhanceAdPrompt(prompt, style, mode);
    res.json({
      success: true,
      enhancedPrompt,
      originalPrompt: prompt,
      style
    });
  } catch (err) {
    console.error('[EnhancePrompt] Error:', err);
    res.status(500).json({ error: 'Failed to enhance prompt.' });
  }
});

/**
 * GET /api/generate/prompt-presets
 * Returns available commercial creative style presets
 */
router.get('/prompt-presets', (req, res) => {
  res.json({ presets: STYLE_PRESETS });
});

module.exports = router;
