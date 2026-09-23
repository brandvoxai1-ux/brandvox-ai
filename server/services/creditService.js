// server/services/creditService.js
const supabase = require('../lib/supabase');

/**
 * Deducts credit amount from user balance atomically and logs usage transactions
 * @param {string} userId - UUID of profile to charge
 * @param {number} amount - Cost in INR to deduct
 * @param {string} description - Log message
 * @param {string} [generationId] - Associated generation ID
 */
async function deductCredits(userId, amount, description, generationId) {
  const cost = parseFloat(amount);
  try {
    const { data: success, error } = await supabase.rpc('deduct_user_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_description: description,
      p_generation_id: generationId || null
    });

    if (error) {
      console.warn('[creditService] RPC deduct_user_credits failed, attempting direct table fallback:', error.message);
      return await deductCreditsDirect(userId, cost, description, generationId);
    }

    if (!success) {
      throw new Error('Insufficient credit balance for this operation.');
    }
  } catch (err) {
    if (err.message.includes('Insufficient credit balance')) {
      throw err;
    }
    console.warn('[creditService] RPC exception, executing direct table fallback:', err.message);
    return await deductCreditsDirect(userId, cost, description, generationId);
  }
}

async function deductCreditsDirect(userId, cost, description, generationId) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('credits, total_spent, total_videos')
    .eq('id', userId)
    .single();

  if (pErr || !profile) {
    throw new Error(`Profile not found: ${pErr ? pErr.message : 'Unknown'}`);
  }

  if ((profile.credits || 0) < cost) {
    throw new Error('Insufficient credit balance for this operation.');
  }

  const { error: uErr } = await supabase
    .from('profiles')
    .update({
      credits: (profile.credits || 0) - cost,
      total_spent: ((profile.total_spent || 0) + cost),
      total_videos: ((profile.total_videos || 0) + 1),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (uErr) {
    throw new Error(`Balance deduction failed: ${uErr.message}`);
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'usage',
    amount: -cost,
    description: description,
    generation_id: generationId || null
  });

  return true;
}

/**
 * Awards credit amount to user balance atomically and logs purchase records
 * @param {string} userId - UUID of profile
 * @param {number} amount - Value in INR to credit
 * @param {string} description - Purchase description
 * @param {string} gatewayPaymentId - Gateway payment hash/ID
 * @param {string} gatewayOrderId - Gateway order hash/ID
 * @param {string} [gatewayName='cashfree'] - Name of the gateway
 */
async function addCredits(userId, amount, description, gatewayPaymentId, gatewayOrderId, gatewayName = 'cashfree') {
  const creditAmount = parseFloat(amount);
  try {
    const { error } = await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: creditAmount,
      p_description: description,
      p_gateway_payment_id: gatewayPaymentId,
      p_gateway_order_id: gatewayOrderId,
      p_gateway_name: gatewayName
    });

    if (error) {
      console.warn('[creditService] RPC add_user_credits failed, attempting direct table fallback:', error.message);
      return await addCreditsDirect(userId, creditAmount, description, gatewayPaymentId, gatewayOrderId, gatewayName);
    }
  } catch (err) {
    console.warn('[creditService] RPC exception, executing direct table fallback:', err.message);
    return await addCreditsDirect(userId, creditAmount, description, gatewayPaymentId, gatewayOrderId, gatewayName);
  }
}

async function addCreditsDirect(userId, creditAmount, description, gatewayPaymentId, gatewayOrderId, gatewayName) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (pErr || !profile) {
    throw new Error(`Profile not found: ${pErr ? pErr.message : 'Unknown'}`);
  }

  const { error: uErr } = await supabase
    .from('profiles')
    .update({
      credits: (profile.credits || 0) + creditAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (uErr) {
    throw new Error(`Credit adjustment failed: ${uErr.message}`);
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount: creditAmount,
    description: description,
    gateway_payment_id: gatewayPaymentId || null,
    gateway_order_id: gatewayOrderId || null,
    gateway_name: gatewayName || 'upi'
  });

  return true;
}

module.exports = { deductCredits, addCredits };

