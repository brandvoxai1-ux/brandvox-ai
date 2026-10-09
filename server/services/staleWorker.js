// server/services/staleWorker.js
const { createClient } = require('@supabase/supabase-js');
const creditService = require('./creditService');
const replicateService = require('./replicateService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STALE_TIMEOUT_MINUTES = 15;
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // Check every 3 minutes

/**
 * Sweeps for generations stuck in 'processing' or 'pending' state
 * for longer than STALE_TIMEOUT_MINUTES and recovers user credits.
 */
async function sweepStaleGenerations() {
  try {
    const cutoffDate = new Date(Date.now() - STALE_TIMEOUT_MINUTES * 60 * 1000).toISOString();

    const { data: staleJobs, error } = await supabase
      .from('generations')
      .select('id, user_id, cost, status, fal_request_id, created_at, model_name')
      .in('status', ['processing', 'pending'])
      .lt('created_at', cutoffDate)
      .limit(20);

    if (error) {
      console.warn('[staleWorker] Failed to query stale generations:', error.message);
      return;
    }

    if (!staleJobs || staleJobs.length === 0) {
      return;
    }

    console.log(`[staleWorker] Found ${staleJobs.length} stale generation(s) exceeding ${STALE_TIMEOUT_MINUTES}m threshold.`);

    for (const job of staleJobs) {
      try {
        let shouldFailAndRefund = false;
        let reason = 'Generation exceeded processing time limit. Credits automatically refunded.';

        if (!job.fal_request_id) {
          // Never reached AI provider queue
          shouldFailAndRefund = true;
          reason = 'Generation aborted before AI model queueing. Credits automatically refunded.';
        } else {
          // Verify with Replicate API
          try {
            const prediction = await replicateService.getPredictionStatus(job.fal_request_id);
            if (!prediction || prediction.status === 'failed' || prediction.status === 'canceled') {
              shouldFailAndRefund = true;
              reason = prediction?.error || 'AI prediction cancelled or failed.';
            } else if (prediction.status === 'succeeded' && prediction.output) {
              // Was actually succeeded, resolve video url
              const videoUrl = replicateService.extractMediaUrl(prediction.output);
              if (videoUrl) {
                await supabase
                  .from('generations')
                  .update({
                    status: 'completed',
                    video_url: videoUrl,
                    thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'
                  })
                  .eq('id', job.id);
                console.log(`[staleWorker] Successfully recovered completed generation: ${job.id}`);
                continue;
              }
            }
          } catch (statusErr) {
            console.warn(`[staleWorker] Could not check status for ${job.fal_request_id}:`, statusErr.message);
            shouldFailAndRefund = true;
          }
        }

        if (shouldFailAndRefund) {
          // 1. Mark generation as failed
          await supabase
            .from('generations')
            .update({
              status: 'failed',
              error_message: reason
            })
            .eq('id', job.id);

          // 2. Refund credits if cost > 0
          if (job.cost && job.cost > 0 && job.user_id) {
            try {
              await creditService.addCredits(
                job.user_id,
                parseFloat(job.cost),
                `Auto-refund for timed-out generation ${job.id}`,
                `autorefund-${job.id}`,
                `autorefund-${job.id}`,
                'refund'
              );
              console.log(`[staleWorker] Refunded ₹${job.cost} to user ${job.user_id} for stale job ${job.id}`);
            } catch (refErr) {
              console.error(`[staleWorker] Refund error for job ${job.id}:`, refErr.message);
            }
          }

          // 3. User notification
          await supabase.from('notifications').insert({
            user_id: job.user_id,
            title: 'Generation Refunded 💰',
            message: `A generation that timed out (${job.model_name || 'AI Video'}) has been refunded (₹${job.cost || 0}).`,
            type: 'info',
            is_read: false
          });

          console.log(`[staleWorker] Cleaned up orphaned job ${job.id}`);
        }
      } catch (jobErr) {
        console.error(`[staleWorker] Error processing job ${job.id}:`, jobErr.message);
      }
    }
  } catch (err) {
    console.error('[staleWorker] Unhandled error during stale sweep:', err.message);
  }
}

/**
 * Initializes the background stale generation cleaner interval.
 */
function initStaleWorker() {
  console.log('[staleWorker] Initializing Stale Generation Recovery Worker (Interval: 3m)...');
  // Initial sweep after 30 seconds
  setTimeout(sweepStaleGenerations, 30000);
  // Recurring interval
  setInterval(sweepStaleGenerations, CHECK_INTERVAL_MS);
}

module.exports = {
  sweepStaleGenerations,
  initStaleWorker
};
