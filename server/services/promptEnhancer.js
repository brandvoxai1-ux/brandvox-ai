// server/services/promptEnhancer.js

/**
 * BrandVox AI Ad Creative Prompt Architecture
 * Transforms basic user prompts into Hollywood-grade, high-converting commercial video and image prompts.
 */

const STYLE_PRESETS = {
  'ad-commercial': {
    name: 'Luxury & Brand Commercial',
    camera: 'anamorphic 35mm lens, smooth gimbal tracking shot, slow cinematic dolly push-in, shallow depth of field, f/1.8 bokeh',
    lighting: 'dramatic studio volumetric lighting, soft rim light, raytraced specular highlights, commercial color science',
    details: 'hyper-detailed 8k resolution, photorealistic textures, clean professional broadcast grade, high-end advertising aesthetic',
    mood: 'prestigious, elegant, high-production commercial quality, polished motion physics'
  },
  'viral-reels': {
    name: 'Viral TikTok & Social Hook',
    camera: 'dynamic handheld motion, fast kinetic zoom, vertical 9:16 framing, eye-level immersive angle',
    lighting: 'vibrant high-contrast lighting, neon accents, golden hour warmth, saturated pop colors',
    details: 'crisp ultra-sharp details, high engagement visual hook, fluid real-world physics, pristine motion blur',
    mood: 'energetic, captivating, viral trend aesthetic, high viewer retention'
  },
  'cinematic': {
    name: 'Hollywood Cinema & VFX',
    camera: 'ARRI Alexa LF camera, Panavision anamorphic, sweeping crane shot, atmospheric perspective, cinematic framing',
    lighting: 'natural chiaroscuro lighting, atmospheric dust particles, volumetric fog, Kodak 5219 film stock color grade',
    details: 'hyper-realistic micro-textures, photorealistic rendering, zero distortion, masterpiece 8k UHD',
    mood: 'epic, emotional, cinematic storytelling, breathtaking scale'
  },
  'product-showcase': {
    name: '3D Kinetic Product Reveal',
    camera: 'extreme macro probe lens, 120fps slow-motion rotational sweep, center-framed hero angle',
    lighting: 'pristine commercial tabletop lighting, softbox diffusion, glossy reflections, dark minimalist studio stage',
    details: 'flawless material rendering, metallic sheen, water droplet textures, crisp product clarity, no artifacts',
    mood: 'cutting-edge, premium industrial design, mesmerizing kinetic energy'
  }
};

/**
 * Enhances a raw user prompt into a high-impact cinematic ad creative prompt
 * @param {string} prompt - Raw user prompt
 * @param {string} [style='ad-commercial'] - Preset style
 * @param {string} [mode='video'] - 'video' | 'swap' | 'image'
 * @returns {string} Fully engineered commercial prompt
 */
function enhanceAdPrompt(prompt, style = 'ad-commercial', mode = 'video') {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return 'Cinematic commercial tracking shot of a luxury product on a sleek stage, dramatic volumetric rim lighting, shallow depth of field, 8k photorealistic';
  }

  const cleanPrompt = prompt.trim().replace(/[.,;]+$/, '');
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS['ad-commercial'];

  if (mode === 'swap') {
    return `${cleanPrompt}, seamless character motion transfer, photorealistic facial fidelity and skin texture, realistic clothing folds matching original choreography, 8k cinematic lighting`;
  }

  if (mode === 'image') {
    return `${cleanPrompt}, ${preset.camera}, ${preset.lighting}, ${preset.details}, editorial commercial photography, award-winning advertising composition`;
  }

  // Video Mode (default)
  return `${cleanPrompt}, ${preset.camera}, ${preset.lighting}, ${preset.details}, ${preset.mood}, continuous seamless motion, 8k resolution`;
}

module.exports = {
  enhanceAdPrompt,
  STYLE_PRESETS
};
