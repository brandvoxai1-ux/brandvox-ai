// server/routes/admin.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const supabase = require('../lib/supabase');
const creditService = require('../services/creditService');
const { createNotification } = require('../services/notificationService');

// Wrap all admin routes with auth and admin verification
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/stats
 * Aggregates site-wide KPIs and statistics for charts
 */
router.get('/stats', async (req, res) => {
  try {
    // 1. Core KPIs
    const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    const { count: totalVideos } = await supabase.from('generations').select('id', { count: 'exact', head: true });
    
    // Total Revenue (sum of all purchase transactions)
    const { data: revenueData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'purchase');
    const totalRevenue = (revenueData || []).reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);

    // Banned users count
    const { count: bannedCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true);

    // Failed generations count
    const { count: failedGens } = await supabase.from('generations').select('id', { count: 'exact', head: true }).eq('status', 'failed');
    const failureRate = totalVideos ? ((failedGens / totalVideos) * 100).toFixed(1) : 0;

    // Credits in circulation
    const { data: profileCredits } = await supabase.from('profiles').select('credits');
    const creditsInCirculation = (profileCredits || []).reduce((acc, p) => acc + parseFloat(p.credits || 0), 0);

    // 2. Real chart data from database
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const { data: dailyGens } = await supabase
      .from('generations')
      .select('created_at')
      .gte('created_at', last7Days[0] + 'T00:00:00.000Z');

    const generationsChart = last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const count = (dailyGens || []).filter(g => g.created_at.startsWith(date)).length;
      return { date: dayName, videos: count };
    });

    const last4Weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const now = new Date();
    const revenueChart = await Promise.all(last4Weeks.map(async (label, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (3 - i) * 7 - 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (3 - i) * 7);
      const { data: weekTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'purchase')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());
      const revenue = (weekTx || []).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      return { date: label, revenue };
    }));

    const { data: modelUsageData } = await supabase
      .from('generations')
      .select('model_name');

    const modelCounts = {};
    (modelUsageData || []).forEach(g => {
      modelCounts[g.model_name] = (modelCounts[g.model_name] || 0) + 1;
    });
    const modelUsageChart = Object.entries(modelCounts).map(([name, value]) => ({ name, value }));

    res.json({
      kpis: {
        totalUsers: totalUsers || 0,
        totalVideosGenerated: totalVideos || 0,
        totalRevenue: totalRevenue || 0,
        bannedUsers: bannedCount || 0,
        failedGenerationsRate: `${failureRate}%`,
        creditsInCirculation: creditsInCirculation || 0
      },
      charts: {
        generationsChart,
        revenueChart,
        modelUsageChart
      }
    });
  } catch (err) {
    console.error('Failed to aggregate stats:', err);
    res.status(500).json({ error: 'Failed to retrieve administrative diagnostics.' });
  }
});

/**
 * GET /api/admin/users
 * Lists user profiles with pagination, search, and role filters
 */
router.get('/users', async (req, res) => {
  const { search, filter, page = 1, limit = 20 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit) - 1;

  try {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (filter === 'banned') {
      query = query.eq('is_banned', true);
    } else if (filter === 'admin') {
      query = query.eq('role', 'admin');
    } else if (filter === 'user') {
      query = query.eq('role', 'user');
    }

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin users lookup error:', err);
    res.status(500).json({ error: 'Failed to fetch users catalog.' });
  }
});

/**
 * GET /api/admin/users/:id
 * Retrieve full details for a user (recent videos + transaction history)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Fetch last 5 videos
    const { data: recentVideos } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch last 5 transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      user,
      recentVideos: recentVideos || [],
      recentTransactions: recentTransactions || []
    });
  } catch (err) {
    console.error('Failed to get user details:', err);
    res.status(500).json({ error: 'Failed to fetch user diagnostic details.' });
  }
});

/**
 * PATCH /api/admin/users/:id/credits
 * Grants or deducts credits to/from a user account (in INR)
 */
router.patch('/users/:id/credits', async (req, res) => {
  const { amount, action, reason } = req.body;
  const targetUserId = req.params.id;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive credit amount.' });
  }

  const creditVal = parseFloat(amount);
  const logReason = reason || `Admin manual adjustment (${action})`;

  try {
    const { data: success, error: rpcErr } = await supabase.rpc('admin_adjust_user_credits', {
      p_user_id: targetUserId,
      p_amount: creditVal,
      p_action: action,
      p_reason: logReason
    });

    if (rpcErr) throw rpcErr;

    if (!success) {
      return res.status(400).json({ error: 'Adjustment failed. User balance would fall below zero.' });
    }

    // Fetch the updated balance to return it
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single();

    const updatedCredits = parseFloat(profile?.credits || 0);

    // Send notifications in background
    if (action === 'grant') {
      await createNotification(targetUserId, 'Credits Granted 🎁', `An administrator manually added ₹${creditVal.toFixed(2)} to your credit balance.`, 'success');
    } else if (action === 'deduct') {
      await createNotification(targetUserId, 'Credits Adjusted 💸', `An administrator manually deducted ₹${creditVal.toFixed(2)} from your credits.`, 'warning');
    }

    res.json({ success: true, updatedCredits });
  } catch (err) {
    console.error('Credits update failed:', err);
    res.status(500).json({ error: 'Failed to apply credit adjustment.' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Changes a user's role (admin / user)
 */
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be user or admin.' });
  }

  try {
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !updatedUser) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Failed to update user authorization role.' });
  }
});

/**
 * PATCH /api/admin/users/:id/ban
 * Bans or unbans a user profile
 */
router.patch('/users/:id/ban', async (req, res) => {
  const { is_banned } = req.body;
  
  try {
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ is_banned: !!is_banned })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !updatedUser) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Ban update error:', err);
    res.status(500).json({ error: 'Failed to modify account ban status.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user profile permanently
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Account deleted from database successfully.' });
  } catch (err) {
    console.error('Deletion error:', err);
    res.status(500).json({ error: 'Failed to remove profile.' });
  }
});

/**
 * GET /api/admin/generations
 * Lists generations globally with user detail, filters, and searches
 */
router.get('/generations', async (req, res) => {
  const { search, model, status, page = 1, limit = 20 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit) - 1;

  try {
    let query = supabase.from('generations').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('prompt', `%${search}%`);
    }
    if (model) {
      query = query.eq('model_id', model);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: generations, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    res.json({
      generations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Admin generations retrieval error:', err);
    res.status(500).json({ error: 'Failed to fetch site generations logs.' });
  }
});

/**
 * POST /api/admin/generations/:id/refund
 * Force-refunds credits for a failed or manual-disputed generation
 */
router.post('/generations/:id/refund', async (req, res) => {
  try {
    const { data: gen, error: genErr } = await supabase
      .from('generations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (genErr || !gen) {
      return res.status(404).json({ error: 'Generation record not found.' });
    }

    if (gen.status === 'refunded') {
      return res.status(400).json({ error: 'This generation cost has already been refunded.' });
    }

    const refundAmount = parseFloat(gen.cost || 0);

    // Refund credits atomically
    await supabase.rpc('add_user_credits', {
      p_user_id: gen.user_id,
      p_amount: refundAmount,
      p_description: `Manual admin refund for generation ${gen.id}`,
      p_gateway_payment_id: `admin-refund-${gen.id}`,
      p_gateway_order_id: `admin-refund-${gen.id}`,
      p_gateway_name: 'admin'
    });

    // Update generation state to failed (refunded)
    await supabase
      .from('generations')
      .update({ status: 'failed', error_message: 'Admin manually refunded.' })
      .eq('id', gen.id);

    await createNotification(gen.user_id, 'Credits Refunded 💰', `₹${refundAmount.toFixed(2)} refunded for video generation "${gen.title || 'Untitled'}" by admin.`, 'success');

    res.json({ success: true, refundedAmount: refundAmount });
  } catch (err) {
    console.error('Failed manual refund processing:', err);
    res.status(500).json({ error: 'Manual refund transaction failed.' });
  }
});

/**
 * GET /api/admin/models
 * Fetch ALL models (both active and inactive) for admin control panels
 */
router.get('/models', async (req, res) => {
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(models);
  } catch (err) {
    console.error('Admin models retrieval failed:', err);
    res.status(500).json({ error: 'Failed to fetch models configuration.' });
  }
});

/**
 * POST /api/admin/models
 * Insert a new model configuration into public.models (Instant studio access!)
 */
router.post('/models', async (req, res) => {
  const modelPayload = req.body;

  if (!modelPayload.id || !modelPayload.name || !modelPayload.provider || !modelPayload.fal_endpoint) {
    return res.status(400).json({ error: 'Missing required configuration keys (ID, Display Name, Provider, Endpoint).' });
  }

  try {
    const { data: newModel, error } = await supabase
      .from('models')
      .insert({
        id: modelPayload.id,
        name: modelPayload.name,
        provider: modelPayload.provider,
        fal_endpoint: modelPayload.fal_endpoint,
        description: modelPayload.description || '',
        price_per_second: parseFloat(modelPayload.price_per_second || 0),
        max_duration: parseInt(modelPayload.max_duration || 15),
        supported_resolutions: modelPayload.supported_resolutions || ['480p', '720p'],
        supported_aspects: modelPayload.supported_aspects || ['16:9', '9:16'],
        supports_audio: !!modelPayload.supports_audio,
        supports_image_input: !!modelPayload.supports_image_input,
        is_active: !!modelPayload.is_active,
        is_featured: !!modelPayload.is_featured,
        badge: modelPayload.badge || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newModel);
  } catch (err) {
    console.error('Failed to save new model:', err);
    res.status(500).json({ error: `Save failed: ${err.message}` });
  }
});

/**
 * PATCH /api/admin/models/:id
 * Modifies an existing model configuration
 */
router.patch('/models/:id', async (req, res) => {
  try {
    const { data: updated, error } = await supabase
      .from('models')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(404).json({ error: 'Target model not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Model update failed:', err);
    res.status(500).json({ error: 'Failed to update model config.' });
  }
});

/**
 * DELETE /api/admin/models/:id
 * Deletes model (soft deletes by setting active flag to false)
 */
router.delete('/models/:id', async (req, res) => {
  try {
    const { data: deleted, error } = await supabase
      .from('models')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !deleted) {
      return res.status(404).json({ error: 'Model config not found.' });
    }

    res.json({ success: true, message: 'Model soft-deleted (flagged inactive) successfully.' });
  } catch (err) {
    console.error('Model delete failed:', err);
    res.status(500).json({ error: 'Failed to remove model.' });
  }
});

/**
 * GET /api/admin/transactions
 * Retrieve all transactions site-wide
 */
router.get('/transactions', async (req, res) => {
  try {
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(txs);
  } catch (err) {
    console.error('Global transactions retrieval failed:', err);
    res.status(500).json({ error: 'Failed to list transactions.' });
  }
});

/**
 * POST /api/admin/credits/grant
 * Mass bulk grants credits to all users (Welcome credits, promotional campaigns etc.)
 */
router.post('/credits/grant', async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive grant amount.' });
  }

  const grantVal = parseFloat(amount);
  const logReason = reason || 'Platform promotional mass grant';

  try {
    // 1. Fetch all user profile IDs
    const { data: users, error: fetchErr } = await supabase.from('profiles').select('id, credits');
    if (fetchErr) throw fetchErr;

    if (!users || users.length === 0) {
      return res.json({ success: true, grantedUsers: 0, message: 'No registered profiles found.' });
    }

    console.log(`[AdminBulk] Initiating bulk grant of ₹${grantVal} to ${users.length} users...`);

    // 2. Perform updates and record transactions
    const bulkPromises = users.map(async (user) => {
      // Adjust credits atomically using RPC
      await supabase.rpc('admin_adjust_user_credits', {
        p_user_id: user.id,
        p_amount: grantVal,
        p_action: 'grant',
        p_reason: logReason
      });

      // Send alert
      await createNotification(
        user.id,
        'Special Credit Grant! 🎁',
        `You have received a platform promotional reward of ₹${grantVal.toFixed(2)} credits! Description: ${logReason}.`,
        'success'
      );
    });

    await Promise.all(bulkPromises);

    res.json({ success: true, grantedUsers: users.length, message: `Dispatched ₹${grantVal} reward successfully to ${users.length} users.` });
  } catch (err) {
    console.error('Bulk grant operation failed:', err);
    res.status(500).json({ error: 'Bulk credit award dispatch failed.' });
  }
});

/**
 * GET /api/admin/settings
 * Retrieve platform configurations from database
 */
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) throw error;

    const settings = {};
    (data || []).forEach(row => {
      // Convert string values back to correct types
      if (row.value === 'true') settings[row.key] = true;
      else if (row.value === 'false') settings[row.key] = false;
      else if (!isNaN(row.value) && row.value !== '') settings[row.key] = parseFloat(row.value);
      else settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve configurations.' });
  }
});

/**
 * PATCH /api/admin/settings
 * Modifies site settings in database
 */
router.patch('/settings', async (req, res) => {
  try {
    const updates = Object.entries(req.body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      await supabase
        .from('platform_settings')
        .upsert(update, { onConflict: 'key' });
    }

    // Return updated settings
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value');

    const settings = {};
    (data || []).forEach(row => {
      if (row.value === 'true') settings[row.key] = true;
      else if (row.value === 'false') settings[row.key] = false;
      else if (!isNaN(row.value) && row.value !== '') settings[row.key] = parseFloat(row.value);
      else settings[row.key] = row.value;
    });

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to write configurations.' });
  }
});

/**
 * GET /api/admin/upi-submissions
 * Lists all manual UPI verification submissions
 */
router.get('/upi-submissions', async (req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('upi_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(submissions || []);
  } catch (err) {
    console.error('[AdminRouter] Failed to list UPI submissions:', err);
    res.status(500).json({ error: 'Failed to fetch manual UPI payment queue.' });
  }
});

/**
 * POST /api/admin/upi-submissions/:id/approve
 * Approves a pending manual UPI payment and awards package credits to the user balance
 */
router.post('/upi-submissions/:id/approve', async (req, res) => {
  const submissionId = req.params.id;
  const { admin_notes } = req.body;

  try {
    // 1. Fetch submission details
    const { data: submission, error: fetchErr } = await supabase
      .from('upi_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !submission) {
      return res.status(404).json({ error: 'UPI payment submission record not found.' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: `This submission has already been processed as: ${submission.status.toUpperCase()}.` });
    }

    // Define standard credit allocations
    const packageCredits = {
      starter: 99.00,
      creator: 274.00,
      pro:     574.00,
      studio:  1199.00
    };

    const creditsToGrant = packageCredits[submission.package_id] || parseFloat(submission.amount);

    // 2. Award credits using Credit Service
    await creditService.addCredits(
      submission.user_id,
      creditsToGrant,
      `Manual UPI Approved: Package ${submission.package_id} (UTR: ${submission.utr_id})`,
      submission.utr_id,
      submission.id,
      'manual_upi'
    );

    // 3. Mark submission as approved
    const { error: updateErr } = await supabase
      .from('upi_submissions')
      .update({
        status: 'approved',
        admin_notes: admin_notes || 'Payment approved and verified.',
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateErr) throw updateErr;

    // 4. Send success notification to user
    await createNotification(
      submission.user_id,
      'UPI Payment Approved! 🎉',
      `Success! Your UPI payment of ₹${submission.amount} (UTR: ${submission.utr_id}) has been verified. Added ₹${creditsToGrant} credits to your account.`,
      'success'
    );

    res.json({ success: true, message: 'UPI submission approved and credits issued.', grantedCredits: creditsToGrant });
  } catch (err) {
    console.error('[AdminRouter] UPI approval error:', err);
    res.status(500).json({ error: 'Failed to approve manual UPI payment.' });
  }
});

/**
 * POST /api/admin/upi-submissions/:id/reject
 * Rejects a pending manual UPI payment request
 */
router.post('/upi-submissions/:id/reject', async (req, res) => {
  const submissionId = req.params.id;
  const { admin_notes } = req.body;

  if (!admin_notes || admin_notes.trim().length === 0) {
    return res.status(400).json({ error: 'A rejection reason / admin note is required.' });
  }

  try {
    // 1. Fetch submission details
    const { data: submission, error: fetchErr } = await supabase
      .from('upi_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !submission) {
      return res.status(404).json({ error: 'UPI payment submission record not found.' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: `This submission has already been processed as: ${submission.status.toUpperCase()}.` });
    }

    // 2. Mark submission as rejected
    const { error: updateErr } = await supabase
      .from('upi_submissions')
      .update({
        status: 'rejected',
        admin_notes: admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateErr) throw updateErr;

    // 3. Send warning notification to user
    await createNotification(
      submission.user_id,
      'UPI Payment Rejected ❌',
      `Rejection Alert: Your UPI submission with UTR ID: ${submission.utr_id} was rejected. Note: ${admin_notes}`,
      'error'
    );

    res.json({ success: true, message: 'UPI submission rejected successfully.' });
  } catch (err) {
    console.error('[AdminRouter] UPI rejection error:', err);
    res.status(500).json({ error: 'Failed to reject manual UPI payment.' });
  }
});

module.exports = router;
