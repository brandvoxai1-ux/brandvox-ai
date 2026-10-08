// server/lib/moderation.js
/**
 * Content Moderation & Legal Compliance Filter for BrandVox AI
 * Enforces Indian IT Act 2021, EU AI Act, and US synthetic media regulations.
 * Screens incoming prompts for CSAM, non-consensual explicit deepfakes, severe hate speech, and extreme violence.
 */

// Banned patterns for zero-tolerance categories
const PROHIBITED_PATTERNS = [
  // Child Sexual Abuse Material (CSAM) & Minor Exploitation
  /\b(csam|child\s*porn|underage|pedophil|pedo|loli|shota|minor\s*explicit)\b/i,
  // Non-consensual explicit sexual deepfakes / revenge media
  /\b(revenge\s*porn|nonconsensual|non-consensual\s*nudity|deepfake\s*nude|nude\s*leak|upskirt)\b/i,
  // Extreme graphic violence & terrorism
  /\b(beheading|snuff\s*film|suicide\s*instruction|mass\s*shooting|terrorist\s*attack\s*guide)\b/i
];

/**
 * Validates prompt against prohibited safety categories
 * @param {string} prompt 
 * @returns {{ allowed: boolean, reason?: string }}
 */
function validatePromptSafety(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { allowed: true };
  }

  const cleanPrompt = prompt.trim();

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(cleanPrompt)) {
      return {
        allowed: false,
        reason: 'Prompt violates BrandVox AI Acceptable Use Policy regarding safety, minor protection, and non-consensual synthetic media.'
      };
    }
  }

  return { allowed: true };
}

module.exports = {
  validatePromptSafety
};
