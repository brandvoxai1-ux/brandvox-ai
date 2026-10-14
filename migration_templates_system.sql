-- ============================================================
-- BrandVox AI — Trending Templates Factory Schema Migration
-- Run in Supabase SQL Editor to enable dynamic viral templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'trending',
  badge TEXT DEFAULT '🔥 Viral Reel',
  source_video_url TEXT NOT NULL,
  audio_url TEXT,
  preview_video_url TEXT,
  preview_image_url TEXT,
  prompt_recipe TEXT NOT NULL,
  model_id TEXT DEFAULT 'kling-3-omni',
  duration INTEGER DEFAULT 15,
  aspect_ratio TEXT DEFAULT '9:16',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Select policy: all users can view active templates
DROP POLICY IF EXISTS "Everyone can view active templates" ON public.templates;
CREATE POLICY "Everyone can view active templates" 
  ON public.templates FOR SELECT 
  USING (is_active = true);

-- Admin policy: admins can insert, update, delete templates
DROP POLICY IF EXISTS "Admins can manage templates" ON public.templates;
CREATE POLICY "Admins can manage templates" 
  ON public.templates FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed initial viral templates
INSERT INTO public.templates (
  id, title, category, badge, source_video_url, preview_video_url, preview_image_url,
  prompt_recipe, model_id, duration, aspect_ratio, is_active, is_featured, uses_count
) VALUES
(
  'tpl-viral-bhangra-energy',
  'Viral High-Energy Bhangra Dance',
  'dance',
  '🔥 Trending Dance',
  'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
  'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
  'Exact character replacement of <<<video_1>>> with <<<image_1>>>, high energy viral choreography motion transfer, seamless facial fidelity, photorealistic 8k studio lighting',
  'kling-3-omni',
  15,
  '9:16',
  true,
  true,
  18420
),
(
  'tpl-cyberpunk-breakdancer',
  'Cyberpunk Neon Breakdancer Stride',
  'dance',
  '⚡ Cyberpunk Choreo',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop',
  'Transform the subject into an agile cyberpunk dancer in matte carbon-fiber techwear and glowing cyan accents, exact choreography motion transfer, reflective neon street, 8k cinematic lighting',
  'kling-3-omni',
  15,
  '9:16',
  true,
  true,
  14320
),
(
  'tpl-billionaire-slow-walk',
  'Billionaire Luxury Stride Entrance',
  'cinematic',
  '💼 Luxury Hook',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
  'Seamless motion transfer, confident billionaire walking toward camera in bespoke tailored charcoal suit, private jet hangar background, luxury cinematic depth of field, 8k realistic',
  'kling-3-omni',
  15,
  '9:16',
  true,
  true,
  12890
),
(
  'tpl-gym-muscle-transformation',
  'Gym Aesthetic & Power Dumbbell Curl',
  'gym',
  '💪 Fitness Viral',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
  'Exact character replacement of <<<video_1>>> with <<<image_1>>>, athletic gym workout motion transfer, dramatic gym rim lighting, defined muscular physique, ultra photorealistic 8k',
  'kling-3-omni',
  15,
  '9:16',
  true,
  true,
  9870
),
(
  'tpl-ai-heartwarming-hug',
  'AI Emotional Heartwarming Hug',
  'hug',
  '❤️ Emotional Trend',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop',
  'Emotional reunion hug, two characters embracing warmly, soft golden hour sunlight, tender expressions, tearful smile, ultra realistic cinematic warm tones',
  'kling-3-omni',
  15,
  '9:16',
  true,
  true,
  21500
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  source_video_url = EXCLUDED.source_video_url,
  preview_video_url = EXCLUDED.preview_video_url,
  preview_image_url = EXCLUDED.preview_image_url,
  prompt_recipe = EXCLUDED.prompt_recipe,
  is_active = true;
