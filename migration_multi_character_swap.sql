-- ============================================================
-- BrandVox AI — Multi-Character Swap Migration
-- Adds 'characters' JSONB column to public.generations table
-- Run in Supabase SQL Editor if required
-- ============================================================

ALTER TABLE public.generations 
  ADD COLUMN IF NOT EXISTS characters JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.generations.characters IS 'Array of target character replacement objects: [{ id, target_image_url, label }]';
