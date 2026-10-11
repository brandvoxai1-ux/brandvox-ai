-- ============================================================
-- BrandVox AI — Seedance 2.5 Flagship Multimodal Migration
-- Run this in your Supabase Dashboard > SQL Editor > New Query
-- ============================================================

INSERT INTO public.models (
  id,
  name,
  provider,
  fal_endpoint,
  description,
  price_per_second,
  max_duration,
  supported_resolutions,
  supported_aspects,
  supports_audio,
  supports_image_input,
  is_active,
  is_featured,
  badge,
  model_type,
  base_cost,
  created_at
)
VALUES (
  'seedance-2.5',
  'Seedance 2.5',
  'ByteDance',
  'bytedance/seedance-2.5',
  'ByteDance''s flagship multimodal video model with native audio, native 30-second generation, and large multimodal reference sets.',
  5.00,
  30,
  ARRAY['480p', '720p', '1080p'],
  ARRAY['16:9', '9:16', '1:1', '4:3'],
  true,
  true,
  true,
  true,
  'Flagship 30s',
  'video',
  0,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = 'Seedance 2.5',
  provider = 'ByteDance',
  fal_endpoint = 'bytedance/seedance-2.5',
  description = 'ByteDance''s flagship multimodal video model with native audio, native 30-second generation, and large multimodal reference sets.',
  price_per_second = 5.00,
  max_duration = 30,
  supported_resolutions = ARRAY['480p', '720p', '1080p'],
  supported_aspects = ARRAY['16:9', '9:16', '1:1', '4:3'],
  supports_audio = true,
  supports_image_input = true,
  is_active = true,
  is_featured = true,
  badge = 'Flagship 30s';
