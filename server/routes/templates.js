// server/routes/templates.js
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Default fallback templates if DB table hasn't been migrated yet
const FALLBACK_TEMPLATES = [
  {
    id: 'tpl-viral-bhangra-energy',
    title: 'Viral High-Energy Bhangra Dance',
    category: 'dance',
    badge: '🔥 Trending Dance',
    source_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    prompt_recipe: 'Exact character replacement of <<<video_1>>> with <<<image_1>>>, high energy viral choreography motion transfer, seamless facial fidelity, photorealistic 8k studio lighting',
    model_id: 'kling-3-omni',
    duration: 15,
    aspect_ratio: '9:16',
    is_active: true,
    is_featured: true,
    uses_count: 18420
  },
  {
    id: 'tpl-cyberpunk-breakdancer',
    title: 'Cyberpunk Neon Breakdancer Stride',
    category: 'dance',
    badge: '⚡ Cyberpunk Choreo',
    source_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    preview_image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop',
    prompt_recipe: 'Transform the subject into an agile cyberpunk dancer in matte carbon-fiber techwear and glowing cyan accents, exact choreography motion transfer, reflective neon street, 8k cinematic lighting',
    model_id: 'kling-3-omni',
    duration: 15,
    aspect_ratio: '9:16',
    is_active: true,
    is_featured: true,
    uses_count: 14320
  },
  {
    id: 'tpl-billionaire-slow-walk',
    title: 'Billionaire Luxury Stride Entrance',
    category: 'cinematic',
    badge: '💼 Luxury Hook',
    source_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    preview_image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
    prompt_recipe: 'Seamless motion transfer, confident billionaire walking toward camera in bespoke tailored charcoal suit, private jet hangar background, luxury cinematic depth of field, 8k realistic',
    model_id: 'kling-3-omni',
    duration: 15,
    aspect_ratio: '9:16',
    is_active: true,
    is_featured: true,
    uses_count: 12890
  },
  {
    id: 'tpl-gym-muscle-transformation',
    title: 'Gym Aesthetic & Power Dumbbell Curl',
    category: 'gym',
    badge: '💪 Fitness Viral',
    source_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    preview_image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
    prompt_recipe: 'Exact character replacement of <<<video_1>>> with <<<image_1>>>, athletic gym workout motion transfer, dramatic gym rim lighting, defined muscular physique, ultra photorealistic 8k',
    model_id: 'kling-3-omni',
    duration: 15,
    aspect_ratio: '9:16',
    is_active: true,
    is_featured: true,
    uses_count: 9870
  },
  {
    id: 'tpl-ai-heartwarming-hug',
    title: 'AI Emotional Heartwarming Hug',
    category: 'hug',
    badge: '❤️ Emotional Trend',
    source_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    preview_image_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop',
    prompt_recipe: 'Emotional reunion hug, two characters embracing warmly, soft golden hour sunlight, tender expressions, tearful smile, ultra realistic cinematic warm tones',
    model_id: 'kling-3-omni',
    duration: 15,
    aspect_ratio: '9:16',
    is_active: true,
    is_featured: true,
    uses_count: 21500
  }
];

/**
 * GET /api/templates
 * Returns all active trending templates
 */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('uses_count', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Graceful fallback if table does not exist or empty
      let filtered = [...FALLBACK_TEMPLATES];
      if (category && category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
      }
      if (search) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
      }
      return res.json({ templates: filtered, source: 'fallback' });
    }

    res.json({ templates: data, source: 'database' });
  } catch (err) {
    console.warn('[TemplatesRoute] Error fetching templates, returning fallbacks:', err.message);
    res.json({ templates: FALLBACK_TEMPLATES, source: 'fallback' });
  }
});

/**
 * GET /api/templates/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      const fb = FALLBACK_TEMPLATES.find(t => t.id === id);
      if (fb) return res.json(fb);
      return res.status(404).json({ error: 'Template not found.' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/templates
 * Admin only: Create a new trending reel template
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      category = 'trending',
      badge = '🔥 Viral Reel',
      source_video_url,
      audio_url,
      preview_video_url,
      preview_image_url,
      prompt_recipe,
      model_id = 'kling-3-omni',
      duration = 15,
      aspect_ratio = '9:16',
      is_featured = false
    } = req.body;

    if (!title || !source_video_url) {
      return res.status(400).json({ error: 'Title and Source Video URL are required.' });
    }

    const id = `tpl-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;

    const newTemplate = {
      id,
      title,
      category,
      badge,
      source_video_url,
      audio_url: audio_url || null,
      preview_video_url: preview_video_url || source_video_url,
      preview_image_url: preview_image_url || null,
      prompt_recipe: prompt_recipe || 'Exact character replacement of <<<video_1>>> with <<<image_1>>>, high fidelity motion transfer, photorealistic 8k',
      model_id,
      duration: parseInt(duration, 10) || 15,
      aspect_ratio,
      is_active: true,
      is_featured: !!is_featured,
      uses_count: 0
    };

    const { data, error } = await supabase
      .from('templates')
      .insert(newTemplate)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, template: data });
  } catch (err) {
    console.error('[TemplatesRoute] Failed to create template:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/templates/:id
 * Admin only: Update existing template
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('templates')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, template: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/templates/:id
 * Admin only: Delete template
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Template removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
