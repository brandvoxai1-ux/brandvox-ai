// server/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Unrestricted Generation Limiter - permits frictionless creation without artificial per-minute caps
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Effectively unrestricted for legitimate user creations
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Request threshold exceeded. Please try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many checkout attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generationLimiter,
  paymentLimiter
};
