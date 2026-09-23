-- ============================================================
-- BrandVox AI — Shift from fal.ai to Replicate Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Upsert Replicate P-Image Ideogram Model
INSERT INTO public.models (
  id, name, provider, fal_endpoint, description, price_per_second,
  max_duration, supported_resolutions, supported_aspects, supports_audio,
  supports_image_input, is_active, is_featured, badge, model_type, base_cost, created_at
)
VALUES (
  'p-image-ideogram',
  'P-Image Ideogram',
  'Pruna AI',
  'prunaai/p-image-ideogram',
  'High-quality photorealistic & stylized images with beautiful typography and composition.',
  0,
  15,
  array['1024x1024', '1280x720', '720x1280', '1024x768', '768x1024'],
  array['1:1', '16:9', '9:16', '4:3', '3:4'],
  false,
  false,
  true,
  true,
  'Ideogram',
  'image',
  10.00,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  fal_endpoint = EXCLUDED.fal_endpoint,
  description = EXCLUDED.description,
  supported_resolutions = EXCLUDED.supported_resolutions,
  supported_aspects = EXCLUDED.supported_aspects,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  badge = EXCLUDED.badge,
  model_type = EXCLUDED.model_type,
  base_cost = EXCLUDED.base_cost;

-- 2. Update existing video models to point to Replicate models if needed
UPDATE public.models
SET fal_endpoint = 'minimax/video-01'
WHERE id = 'minimax-hailuo';

UPDATE public.models
SET fal_endpoint = 'kuaishou/kling-v1'
WHERE id = 'kling-video-1-6';

UPDATE public.models
SET fal_endpoint = 'wan-video/wan-2.1-1.3b'
WHERE id = 'wan-2-5-fast';

-- 3. Confirm active models
SELECT id, name, provider, fal_endpoint, model_type, base_cost, price_per_second, is_active
FROM public.models
WHERE is_active = true
ORDER BY model_type, name;
