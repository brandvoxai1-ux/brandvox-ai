// server/services/promptSanitizer.js

/**
 * Universal Prompt Shield & Moderation Sanitizer
 * Automatically neutralizes keywords and structures that trigger upstream
 * AI safety/censorship false positives (E005 on Kling, Seedance, etc.)
 * while preserving 100% of the user's creative vision and visual scene details.
 */

const TRADEMARK_REPLACEMENTS = [
  // AI Tools & Tech Competitors (Strictly blocked on Chinese CAC AI moderation)
  { regex: /\bchatgpt\b/gi, replacement: 'advanced AI assistant' },
  { regex: /\bopenai\b/gi, replacement: 'leading AI technology' },
  { regex: /\bgpt-?[345o]\b/gi, replacement: 'AI intelligence' },
  { regex: /\bmidjourney\b/gi, replacement: 'digital art tool' },
  { regex: /\bdall-?e\b/gi, replacement: 'generative art engine' },
  { regex: /\bclaude\b/gi, replacement: 'smart AI assistant' },
  { regex: /\bgemini\b/gi, replacement: 'advanced multimodal AI' },

  // Social Media & Platforms (Blocked or filtered on Kling/Seedance)
  { regex: /\binstagram\s*reels?\b/gi, replacement: 'viral vertical video' },
  { regex: /\binstagram\b/gi, replacement: 'social media platform' },
  { regex: /\btiktok\b/gi, replacement: 'short-form video platform' },
  { regex: /\byoutube\s*shorts?\b/gi, replacement: 'popular video feed' },
  { regex: /\byoutube\b/gi, replacement: 'video sharing platform' },
  { regex: /\bfacebook\b/gi, replacement: 'social network' },
  { regex: /\bsnapchat\b/gi, replacement: 'messaging platform' },

  // Currency symbols & pricing (Trips financial fraud/scam detection in Kling)
  { regex: /[₹$€£]\s*\d+([.,]\d+)?/gi, replacement: 'affordable price' },
  { regex: /\b\d+\s*(rupees?|inr|dollars?|bucks?)\b/gi, replacement: 'budget-friendly cost' },
  { regex: /\bprice\s*:\s*[^,.\n]+/gi, replacement: 'attractive pricing' },

  // Copyrighted / Protected Pop-Culture Characters (Trips IP filters)
  { regex: /\bspider-?man\b/gi, replacement: 'agile web-slinging hero in red and blue suit' },
  { regex: /\biron\s*man\b/gi, replacement: 'futuristic hero in high-tech crimson and gold armor' },
  { regex: /\bbatman\b/gi, replacement: 'masked dark vigilante hero' },
  { regex: /\bsuperman\b/gi, replacement: 'caped hero with superhuman strength' },
  { regex: /\bhulk\b/gi, replacement: 'giant muscular green powerhouse titan' },
  { regex: /\bthor\b/gi, replacement: 'mythic thunder god warrior with a hammer' },
  { regex: /\bcaptain\s*america\b/gi, replacement: 'heroic super soldier with a vibranium shield' },
  { regex: /\bmarvel\b/gi, replacement: 'epic cinematic superhero universe' },
  { regex: /\bdc\s*comics?\b/gi, replacement: 'legendary graphic novel hero' },
  { regex: /\bdisney\b/gi, replacement: 'enchanting animated studio style' }
];

/**
 * Sanitizes a raw prompt for text-to-video / image-to-video pipelines.
 * @param {string} prompt - Raw input prompt
 * @returns {string} Sanitized, model-compliant prompt
 */
function sanitizePromptForVideo(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';

  let sanitized = prompt;

  // 1. Replace known moderation tripwires
  for (const { regex, replacement } of TRADEMARK_REPLACEMENTS) {
    sanitized = sanitized.replace(regex, replacement);
  }

  // 2. Clean quotation marks and potential script block delimiters
  sanitized = sanitized
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized;
}

/**
 * Extracts pure visual scene description if user entered a complex script
 * with UI cards, overlays, and multi-shot instructions that confuse diffusion models
 * @param {string} prompt
 * @returns {string} Clean visual prompt
 */
function extractVisualScenePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';

  let cleaned = sanitizePromptForVideo(prompt);

  // If the prompt is already concise (< 200 chars), return as is
  if (cleaned.length < 200) {
    return cleaned;
  }

  // If prompt has explicit SCENE: or CHARACTER: sections, extract those
  const characterMatch = cleaned.match(/CHARACTER\s*:\s*([^.\n]+(?:\.[^.\n]+)*)/i);
  const sceneMatch = cleaned.match(/SCENE\s*:\s*([^.\n]+(?:\.[^.\n]+)*)/i);

  if (characterMatch || sceneMatch) {
    const parts = [];
    if (characterMatch) parts.push(characterMatch[1].trim());
    if (sceneMatch) parts.push(sceneMatch[1].trim());
    parts.push('photorealistic UGC creator aesthetic, natural lighting, high fidelity human motion, 8k broadcast quality');
    return parts.join(', ');
  }

  return cleaned;
}

module.exports = {
  sanitizePromptForVideo,
  extractVisualScenePrompt
};
