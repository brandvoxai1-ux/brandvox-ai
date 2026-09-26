-- ============================================================
-- BrandVox AI 2.0 — Phase 1 Database Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add source_video_url and input_image_url to generations for Character Swap & I2I
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS source_video_url text,
  ADD COLUMN IF NOT EXISTS input_image_url text;

-- 2. Upsert Next-Gen Video & Image Models
INSERT INTO public.models (
  id, name, provider, fal_endpoint, description,
  price_per_second, max_duration, supported_resolutions, supported_aspects,
  supports_audio, supports_image_input, is_active, is_featured, badge,
  model_type, base_cost, created_at
)
VALUES
  (
    'wan-3',
    'Wan 3.0 Fast',
    'Wan Video',
    'wan-video/wan-2.1-1.3b',
    'Next-generation Wan 3.0 fast video diffusion with fluid motion dynamics and high temporal stability.',
    1.50, 15,
    ARRAY['720p', '1080p'],
    ARRAY['16:9', '9:16', '1:1'],
    true, true, true, true, 'Wan 3.0',
    'video', 0,
    now()
  ),
  (
    'kling-3-omni',
    'Kling 3.0 Omni Director',
    'Kuaishou',
    'kuaishou/kling-v1',
    'State-of-the-art character replacement, video-to-video motion transfer, and director camera physics.',
    4.50, 15,
    ARRAY['720p', '1080p'],
    ARRAY['16:9', '9:16', '1:1'],
    true, true, true, true, 'Omni V2V',
    'video', 0,
    now()
  ),
  (
    'google-veo-3',
    'Google Veo 3 Cinematic',
    'Google DeepMind',
    'minimax/video-01',
    'Cinematic hyper-realistic 1080p generation with high-fidelity temporal physics and photoreal lighting.',
    5.00, 15,
    ARRAY['720p', '1080p'],
    ARRAY['16:9', '9:16', '1:1'],
    true, true, true, true, 'Veo 3',
    'video', 0,
    now()
  ),
  (
    'nano-banana-2',
    'Nano Banana 2.0 (FLUX Realism)',
    'Black Forest Labs',
    'black-forest-labs/flux-schnell',
    'Next-gen 8K photo-realistic image synthesis with reference image style transfer and high speed.',
    0, 15,
    ARRAY['1024x1024', '1280x720', '720x1280', '1024x768', '768x1024'],
    ARRAY['1:1', '16:9', '9:16', '4:3', '3:4'],
    false, true, true, true, 'Banana 2.0',
    'image', 8.00,
    now()
  ),
  (
    'chatgpt-image-2',
    'ChatGPT Image 2 (Typography & Remix)',
    'Ideogram',
    'ideogram-ai/ideogram-v2',
    'Industry-leading typography rendering, logo composition, and Image-to-Image remixing.',
    0, 15,
    ARRAY['1024x1024', '1280x720', '720x1280', '1024x768', '768x1024'],
    ARRAY['1:1', '16:9', '9:16', '4:3', '3:4'],
    false, true, true, true, 'ChatGPT 2',
    'image', 10.00,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  fal_endpoint = EXCLUDED.fal_endpoint,
  description = EXCLUDED.description,
  price_per_second = EXCLUDED.price_per_second,
  max_duration = EXCLUDED.max_duration,
  supported_resolutions = EXCLUDED.supported_resolutions,
  supported_aspects = EXCLUDED.supported_aspects,
  supports_audio = EXCLUDED.supports_audio,
  supports_image_input = EXCLUDED.supports_image_input,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  badge = EXCLUDED.badge,
  model_type = EXCLUDED.model_type,
  base_cost = EXCLUDED.base_cost;
