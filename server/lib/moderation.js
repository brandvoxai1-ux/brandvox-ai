// server/lib/moderation.js
/**
 * Content Moderation Filter for BrandVox AI
 * Fully unrestricted: Allows all creative visual prompts through directly to upstream AI models.
 */

function validatePromptSafety(prompt) {
  // Unrestricted: Allow all creative inputs through to upstream model
  return { allowed: true };
}

module.exports = {
  validatePromptSafety
};
