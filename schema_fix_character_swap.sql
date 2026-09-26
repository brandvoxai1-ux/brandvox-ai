-- ============================================================
-- BrandVox AI - Character Swap & Ephemeral Schema Fix
-- Run this in Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1. Add source_video_url and input_image_url columns to generations
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS source_video_url TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS input_image_url TEXT;

-- 2. Update generation_type check constraint to include 'swap'
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_generation_type_check;
ALTER TABLE public.generations ADD CONSTRAINT generations_generation_type_check CHECK (generation_type IN ('video', 'image', 'swap'));

-- 3. Notify PostgREST to refresh its schema cache immediately
NOTIFY pgrst, 'reload schema';
