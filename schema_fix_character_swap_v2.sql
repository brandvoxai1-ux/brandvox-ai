-- ============================================================
-- BrandVox AI — Character Swap & Model Registry Migration V2
-- Run this in your Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Add missing reference columns to generations table for Character Swap
ALTER TABLE public.generations 
  ADD COLUMN IF NOT EXISTS source_video_url text,
  ADD COLUMN IF NOT EXISTS input_image_url text;

-- 2. Update generation_type check constraint to permit 'swap'
ALTER TABLE public.generations 
  DROP CONSTRAINT IF EXISTS generations_generation_type_check;

ALTER TABLE public.generations 
  ADD CONSTRAINT generations_generation_type_check 
  CHECK (generation_type IN ('video', 'image', 'swap'));

-- 3. Correct Seedance 2.0 pricing (from 60.00 down to 5.00 INR/second)
UPDATE public.models 
SET 
  price_per_second = 5.00,
  max_duration = 15,
  supported_resolutions = ARRAY['720p', '1080p'],
  supported_aspects = ARRAY['16:9', '9:16', '1:1']
WHERE id IN ('seedance-2', 'seedance-2-i2v');

-- 4. Ensure Kling 3.0 Omni Director is active and configured
INSERT INTO public.models (
  id, name, provider, fal_endpoint, description,
  price_per_second, max_duration, supported_resolutions, supported_aspects,
  supports_audio, supports_image_input, is_active, is_featured, badge,
  model_type, base_cost, created_at
)
VALUES (
  'kling-3-omni',
  'Kling 3.0 Omni Director',
  'KwaiVGI (Kling)',
  'kwaivgi/kling-v3-omni-video',
  'State-of-the-art character replacement, video-to-video motion transfer, and director camera physics.',
  4.50, 10,
  ARRAY['720p', '1080p'],
  ARRAY['16:9', '9:16', '1:1'],
  true, true, true, true, 'Omni V2V',
  'video', 0,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  fal_endpoint = 'kwaivgi/kling-v3-omni-video',
  price_per_second = 4.50,
  max_duration = 10,
  is_active = true,
  badge = 'Omni V2V';
