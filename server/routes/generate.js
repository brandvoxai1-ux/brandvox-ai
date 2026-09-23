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

  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompts cannot exceed 500 characters.' });
  }

  if (!model_id) {
    return res.status(400).json({ error: 'Please select an AI video model.' });
  }

  const selectedDuration = parseInt(duration) || 10; // default 10 seconds
  const selectedAudio = !!generate_audio;

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

    // Assert inputs compatibility
    if (model.supports_image_input && !image_url) {
      return res.status(400).json({ error: 'An input image URL is required for this image-to-video model.' });
    }

    if (selectedDuration > model.max_duration) {
      return res.status(400).json({ error: `Selected duration exceeds model maximum of ${model.max_duration} seconds.` });
    }

    // Cost = duration * price_per_second
    const pricePerSec = parseFloat(model.price_per_second);
    const estimatedCost = selectedDuration * pricePerSec;

    // 3. Server-side credit check
    if (req.user.credits < estimatedCost) {
      return res.status(400).json({
        error: `Insufficient balance. Estimated cost is ₹${estimatedCost.toFixed(2)}, but you only have ₹${req.user.credits.toFixed(2)} credits.`
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
          // Synchronous fallback success
          console.log(`[BackgroundWorker] Synchronous result returned. Archiving video files.`);
          const permanentVideoUrl = await archiveVideo(result.video_url, req.user.id, generation.id);
          const placeholderThumbnail = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';

          await supabase
            .from('generations')
            .update({
              status: 'completed',
              video_url: permanentVideoUrl,
              thumbnail_url: placeholderThumbnail
            })
            .eq('id', generation.id);

          await createNotification(
            req.user.id,
            'Video Ready! 🎬',
            `Your video generation with "${model.name}" has completed successfully.`,
            'success'
          );
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
  const { prompt, model_id, aspect_ratio = '1:1' } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a prompt describing your image.' });
  }
  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompts cannot exceed 500 characters.' });
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
        error: `Insufficient balance. This model costs ₹${cost.toFixed(2)} but you have ₹${req.user.credits.toFixed(2)}.`
      });
    }

    // 3. Map aspect_ratio to fal.ai image_size param
    const sizeMap = { '1:1': 'square_hd', '4:3': 'landscape_4_3', '3:4': 'portrait_4_3', '16:9': 'landscape_16_9', '9:16': 'portrait_16_9' };
    const image_size = sizeMap[aspect_ratio] || 'landscape_4_3';

    // 4. Create generation record
    const defaultTitle = prompt.slice(0, 30).trim() + '...';
    const { data: generation, error: dbErr } = await supabase
      .from('generations')
      .insert({
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
        is_public: false
      })
      .select()
      .single();

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
        aspect_ratio
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

    // 7. Archive image permanently to Supabase Storage and mark completed
    const permanentImageUrl = await archiveImage(imageResult.image_url, req.user.id, generation.id);

    await supabase.from('generations').update({
      status: 'completed',
      video_url: permanentImageUrl,
      thumbnail_url: permanentImageUrl
    }).eq('id', generation.id);

    await createNotification(req.user.id, 'Image Ready! 🖼️', `Your image from "${model.name}" is ready.`, 'success');

    // 8. Respond synchronously (no polling needed)
    res.status(200).json({
      success: true,
      generationId: generation.id,
      image_url: permanentImageUrl,
      cost
    });

  } catch (err) {
    console.error('[generate/image] Error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed.' });
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

    const { data: gens, error, count } = await supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
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

/**
 * Shared logic to process generation webhooks and development-mode queue polling results
 */
async function handleWebhookLogic(generationId, status, payload, errorMsg) {
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

      // Archive video permanently to Supabase Storage
      const permanentVideoUrl = await archiveVideo(originalMediaUrl, gen.user_id, gen.id);

      await supabase
        .from('generations')
        .update({
          status: 'completed',
          video_url: permanentVideoUrl,
          thumbnail_url: placeholderThumbnail
        })
        .eq('id', generationId);

      await createNotification(
        gen.user_id,
        'Video Ready! 🎬',
        `Your video generation with "${gen.model_name}" has completed successfully.`,
        'success'
      );
      
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
    const { data: gen, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !gen) {
      return res.status(404).json({ error: 'Video generation record not found.' });
    }

    // Dynamic watermark check
    const { count: purchaseCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('type', 'purchase');

    const watermarkRequired = (purchaseCount || 0) === 0;

    res.json({
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

module.exports = router;
