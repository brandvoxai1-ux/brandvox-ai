-- ============================================================
-- BrandVox AI — Dynamic Models & Credit Pipeline Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add model_type column to models table
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS model_type text DEFAULT 'video'
  CHECK (model_type IN ('video', 'image'));

-- 2. Add base_cost column (used for fixed-price image generations)
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS base_cost numeric DEFAULT 0
  CHECK (base_cost >= 0);

-- 3. Add generation_type column to generations table
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS generation_type text DEFAULT 'video'
  CHECK (generation_type IN ('video', 'image'));

-- 4. Mark all existing models as video type by default
UPDATE public.models SET model_type = 'video' WHERE model_type IS NULL;

-- ============================================================
-- 5. Upsert VIDEO models
-- ============================================================
INSERT INTO public.models (id, name, provider, fal_endpoint, description, price_per_second, max_duration, supported_resolutions, supported_aspects, supports_audio, supports_image_input, is_active, is_featured, badge, model_type, base_cost, created_at)
VALUES
  (
    'wan-2-5-fast',
    'Wan 2.5 Fast',
    'Alibaba',
    'fal-ai/wan/v2.5/text-to-video',
    'Upgraded WAN model — faster renders, better motion quality at budget pricing.',
    1.50, 15,
    array['480p','720p'],
    array['16:9','9:16','1:1','4:3'],
    false, false, true, false, 'Budget',
    'video', 0,
    now()
  ),
  (
    'minimax-hailuo',
    'MiniMax Hailuo',
    'MiniMax',
    'fal-ai/minimax/video-01',
    'Specialized in realistic human motion and facial expression consistency.',
    3.50, 15,
    array['720p'],
    array['16:9','9:16','1:1'],
    true, false, true, true, 'Realistic',
    'video', 0,
    now()
  ),
  (
    'kling-video-1-6',
    'Kling Video',
    'Kuaishou',
    'fal-ai/kling-video/v1.6/standard/text-to-video',
    'Cinematic quality video with precise camera motion control and smooth transitions.',
    4.50, 15,
    array['720p'],
    array['16:9','9:16'],
    true, false, true, true, 'Cinematic',
    'video', 0,
    now()
  ),
  (
    'seedance-2-0-fast',
    'Seedance 2.0 Fast',
    'ByteDance',
    'fal-ai/hunyuan-video',
    'Character consistency and rapid motion rendering.',
    2.00, 15,
    array['720p'],
    array['16:9','9:16','1:1'],
    false, false, true, false, 'Fast',
    'video', 0,
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
  badge = EXCLUDED.badge,
  model_type = EXCLUDED.model_type,
  base_cost = EXCLUDED.base_cost;

-- ============================================================
-- 6. Upsert IMAGE models (setting max_duration = 15 to pass any check constraint)
-- ============================================================
INSERT INTO public.models (id, name, provider, fal_endpoint, description, price_per_second, max_duration, supported_resolutions, supported_aspects, supports_audio, supports_image_input, is_active, is_featured, badge, model_type, base_cost, created_at)
VALUES
  (
    'nano-banana',
    'Nano Banana',
    'Black Forest Labs',
    'fal-ai/flux/schnell',
    'Ultra-fast image generation at low cost. Great for rapid prototyping and concept art.',
    0, 15,
    array['512x512','1024x1024','1024x768','768x1024'],
    array['1:1','4:3','3:4','16:9'],
    false, false, true, false, 'Fast',
    'image', 8.00,
    now()
  ),
  (
    'chatgpt-image',
    'ChatGPT Image',
    'Black Forest Labs',
    'fal-ai/flux/dev',
    'High detail, prompt-accurate image generation. Best for commercial and final output quality.',
    0, 15,
    array['512x512','1024x1024','1024x768','768x1024'],
    array['1:1','4:3','3:4','16:9'],
    false, false, true, false, 'HD',
    'image', 20.00,
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
  badge = EXCLUDED.badge,
  model_type = EXCLUDED.model_type,
  base_cost = EXCLUDED.base_cost;

-- ============================================================
-- 7. Verify All Active Models
-- ============================================================
SELECT id, name, model_type, price_per_second, base_cost, badge, is_active
FROM public.models
WHERE is_active = true
ORDER BY model_type, name;
