// server/services/cleanupService.js
const supabase = require('../lib/supabase');

/**
 * Purges reference photos and source videos older than strictly 7 days
 * to protect user privacy and optimize storage.
 * 
 * NOTE: Final compiled creations in the 'videos' bucket are NEVER touched or removed.
 */
async function purgeExpiredUploads() {
  const RETENTION_DAYS = 7;
  const cutoffTime = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  console.log(`[CleanupService] Commencing 7-day ephemeral storage purge. Cutoff: ${cutoffTime}`);

  let filesRemovedCount = 0;
  let recordsClearedCount = 0;

  try {
    // 1. Purge expired files from Supabase Storage 'uploads' bucket
    const { data: files, error: listErr } = await supabase.storage
      .from('uploads')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listErr) {
      console.warn('[CleanupService] Could not list uploads bucket:', listErr.message);
    } else if (files && files.length > 0) {
      const expiredFiles = files
        .filter((file) => file.created_at && file.created_at < cutoffTime)
        .map((file) => file.name);

      if (expiredFiles.length > 0) {
        const { error: removeErr } = await supabase.storage
          .from('uploads')
          .remove(expiredFiles);

        if (removeErr) {
          console.error('[CleanupService] Error removing expired uploads:', removeErr.message);
        } else {
          filesRemovedCount = expiredFiles.length;
          console.log(`[CleanupService] Successfully deleted ${filesRemovedCount} reference files older than 7 days.`);
        }
      }
    }

    // 2. Clear input references from generations table older than 7 days
    const { data: updatedRows, error: dbErr } = await supabase
      .from('generations')
      .update({
        input_image_url: null,
        source_video_url: null
      })
      .lt('created_at', cutoffTime)
      .or('input_image_url.not.is.null,source_video_url.not.is.null')
      .select('id');

    if (dbErr) {
      console.warn('[CleanupService] Note on database reference clearance:', dbErr.message);
    } else if (updatedRows) {
      recordsClearedCount = updatedRows.length;
    }

    console.log(`[CleanupService] Purge completed. Files purged: ${filesRemovedCount}, DB references cleared: ${recordsClearedCount}. Final creations remain 100% permanent.`);
  } catch (err) {
    console.error('[CleanupService] Unexpected purge exception:', err.message);
  }
}

/**
 * Automatically purges failed generation attempts from Supabase database
 * so temporary failures don't clutter the database permanently.
 * Keeps only for a short grace window (10 minutes) so the user has time
 * to see the error message in the UI while polling.
 */
async function purgeFailedGenerations() {
  const RETENTION_MINUTES = 10;
  const cutoffTime = new Date(Date.now() - RETENTION_MINUTES * 60 * 1000).toISOString();
  try {
    const { data: deleted, error } = await supabase
      .from('generations')
      .delete()
      .eq('status', 'failed')
      .lt('created_at', cutoffTime)
      .select('id');

    if (error) {
      console.warn('[CleanupService] Note on failed generations cleanup:', error.message);
    } else if (deleted && deleted.length > 0) {
      console.log(`[CleanupService] Purged ${deleted.length} obsolete failed generation records.`);
    }
  } catch (err) {
    console.error('[CleanupService] Failed generations purge exception:', err.message);
  }
}

/**
 * Initializes the automated cleanup workers
 */
function initCleanupService() {
  console.log('[CleanupService] Initializing 7-Day Ephemeral Storage Privacy Worker...');
  
  // Run an initial check 30 seconds after server startup
  setTimeout(() => {
    purgeExpiredUploads();
  }, 30000);

  // Repeat every 24 hours (86,400,000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    purgeExpiredUploads();
  }, TWENTY_FOUR_HOURS);

  // Check and purge obsolete failed generations on startup and every 10 minutes
  setTimeout(() => {
    purgeFailedGenerations();
  }, 10000);

  const TEN_MINUTES = 10 * 60 * 1000;
  setInterval(() => {
    purgeFailedGenerations();
  }, TEN_MINUTES);
}

module.exports = {
  initCleanupService,
  purgeExpiredUploads,
  purgeFailedGenerations
};
