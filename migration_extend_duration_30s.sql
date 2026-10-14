-- ============================================================
-- BrandVox AI — Extend Video Duration up to 30 Seconds
-- Run in Supabase SQL Editor if you want to update model metadata
-- ============================================================

UPDATE public.models 
SET max_duration = 30
WHERE id IN ('kling-3-omni', 'seedance-2.5', 'seedance-2', 'bytedance/seedance-2.5', 'kwaivgi/kling-v3-omni-video');

-- Confirm updated models
SELECT id, name, model_type, max_duration, price_per_second, is_active 
FROM public.models;
