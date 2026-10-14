// server/services/promptSanitizer.js

/**
 * Universal Prompt Pass-Through Engine
 * Fully unrestricted: Delivers 100% of user's exact creative vision, dialogues,
 * brand names, and script details directly to the AI model without censorship,
 * word blacklists, or text trimming.
 */

function sanitizePromptForVideo(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';
  return prompt.trim();
}

function extractVisualScenePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';
  return prompt.trim();
}

module.exports = {
  sanitizePromptForVideo,
  extractVisualScenePrompt,
  TRADEMARK_REPLACEMENTS: []
};
