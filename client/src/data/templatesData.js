// client/src/data/templatesData.js
/**
 * Curated catalog of trending video and image prompt templates for BrandVox AI
 */

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'reels', label: '📱 Instagram & TikTok Reels' },
  { id: 'ecommerce', label: '🛍️ E-Commerce Ads' },
  { id: 'cinematic', label: '🎬 Cinematic & Sci-Fi' },
  { id: 'anime', label: '⛩️ Anime & Stylized' },
  { id: 'images', label: '🎨 Art & Typography' }
];

export const TEMPLATES = [
  // 1. REELS & SOCIAL HOOKS
  {
    id: 'tpl-reels-cyberpunk-walk',
    title: 'Cyberpunk Neon Street Walk',
    category: 'reels',
    media_type: 'video',
    badge: 'Trending Hook',
    preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'Cinematic slow-motion vertical tracking shot of a mysterious figure in a dark trench coat walking through a neon-drenched futuristic Tokyo street, holographic neon reflections on wet asphalt, volumetric cyan and magenta steam, 8k realism',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Reel', 'Cyberpunk', 'Neon', 'Urban'],
    uses_count: 2450
  },
  {
    id: 'tpl-reels-streetwear-motion',
    title: 'Urban Streetwear Slow-Motion',
    category: 'reels',
    media_type: 'video',
    badge: 'Fashion Viral',
    preview_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-neon-light-39879-large.mp4',
    prompt: 'Low-angle fashion runway tracking shot of a model wearing oversized [Color/Brand] technical streetwear jacket, walking forward through gentle atmospheric mist, dynamic rim lighting, smooth 60fps slow-motion motion blur',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Streetwear', 'Fashion', 'SlowMo', 'Viral'],
    uses_count: 1890
  },
  {
    id: 'tpl-reels-dancing-robot',
    title: 'Futuristic Robot Dance Reel',
    category: 'reels',
    media_type: 'video',
    badge: 'Viral Sound',
    preview_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'A sleek white and chrome humanoid robot performing a smooth hip-hop dance routine on an illuminated LED studio dancefloor, synchronized fluid joints, reflections on glossy floor, cinematic stage lights',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Robot', 'Dance', 'CGI', 'SciFi'],
    uses_count: 3210
  },

  // 2. E-COMMERCE & PRODUCT ADS
  {
    id: 'tpl-ecom-perfume-splash',
    title: 'Luxury Perfume Water Splash',
    category: 'ecommerce',
    media_type: 'video',
    badge: 'High Conversion',
    preview_image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-water-splashing-in-slow-motion-1191-large.mp4',
    prompt: 'Ultra slow-motion cinematic macro shot of an elegant frosted glass perfume bottle plunging into crystal clear turquoise water, thousands of micro-droplets exploding upward in zero gravity, studio luxury key lighting, pristine refraction',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '1:1',
    duration: 6,
    tags: ['Commercial', 'Luxury', 'Splash', 'Product'],
    uses_count: 4120
  },
  {
    id: 'tpl-ecom-sneaker-levitate',
    title: 'Zero-Gravity Sneaker Spin',
    category: 'ecommerce',
    media_type: 'video',
    badge: 'Footwear Ad',
    preview_image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-lights-and-smoke-40156-large.mp4',
    prompt: 'Commercial product shot of a futuristic athletic running shoe hovering in mid-air against a deep obsidian background, slowly rotating 360 degrees, glowing fiber optic laces, subtle ambient smoke swirls, commercial studio rim lighting',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Sneakers', '360Spin', 'Ecommerce', 'Motion'],
    uses_count: 2780
  },
  {
    id: 'tpl-ecom-coffee-crema',
    title: 'Rich Coffee Bean Vortex',
    category: 'ecommerce',
    media_type: 'video',
    badge: 'Food & Beverage',
    preview_image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-42528-large.mp4',
    prompt: 'Macro extreme slow-motion shot of dark roasted oily coffee beans cascading into an artisanal ceramic cup, rich aromatic steam curling upward in warm morning sunbeams, golden light rimming the velvety crema',
    model_id: 'kling-video-1-6',
    model_name: 'Kling Video',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Coffee', 'Cafe', 'Macro', 'Commercial'],
    uses_count: 1540
  },

  // 3. CINEMATIC & SCI-FI
  {
    id: 'tpl-cine-hypercar-drift',
    title: 'Matte-Black Hypercar Drift',
    category: 'cinematic',
    media_type: 'video',
    badge: 'Automotive Cinema',
    preview_image_url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-sports-car-drifting-at-night-41584-large.mp4',
    prompt: 'Cinematic tracking drone shot of a menacing matte black futuristic sports car drifting aggressively around a wet city hairpin curve at midnight, burning rubber tire smoke, glowing red taillight streaks, Hollywood action camera angle',
    model_id: 'kling-video-1-6',
    model_name: 'Kling Video',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Supercar', 'Drift', 'Cinematic', 'Night'],
    uses_count: 3680
  },
  {
    id: 'tpl-cine-interstellar-launch',
    title: 'Interstellar Starship Launch',
    category: 'cinematic',
    media_type: 'video',
    badge: 'Sci-Fi Epic',
    preview_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-the-stars-in-space-39870-large.mp4',
    prompt: 'Epic wide cinematic shot of a massive colonial starship igniting twin cobalt-blue fusion thrusters over an alien ocean world, colossal shockwaves rippling across purple water, cinematic lens flare, IMAX composition',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Spaceship', 'SciFi', 'IMAX', 'Epic'],
    uses_count: 2990
  },

  // 4. ANIME & STYLIZED
  {
    id: 'tpl-anime-twilight-city',
    title: 'Anime Girl on Skyscraper Rooftop',
    category: 'anime',
    media_type: 'video',
    badge: 'Makoto Shinkai Style',
    preview_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-over-a-city-at-sunset-41484-large.mp4',
    prompt: 'Breathtaking anime style cinematic scene, a young girl standing on a high-rise Tokyo rooftop at twilight looking up at shooting stars across a deep indigo and pastel orange sky, wind gently blowing her hair and uniform, Makoto Shinkai aesthetic',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.5 Fast',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Anime', 'Ghibli', 'Sky', 'Emotional'],
    uses_count: 4890
  },
  {
    id: 'tpl-anime-samurai-sakura',
    title: 'Samurai Sakura Blade Duel',
    category: 'anime',
    media_type: 'video',
    badge: 'Action Animation',
    preview_image_url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop',
    preview_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-falling-pink-sakura-petals-41604-large.mp4',
    prompt: 'Dynamic stylized Japanese anime duel in a misty bamboo grove, two samurai clashing steel katanas as luminous pink cherry blossom petals swirl furiously in the wind, dramatic camera rotation, high-energy impact sparks',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Samurai', 'Anime', 'Sakura', 'Katana'],
    uses_count: 2210
  },

  // 5. ART & TYPOGRAPHY IMAGES
  {
    id: 'tpl-art-impasto-sunset',
    title: 'Romantic Impasto Oil Painting',
    category: 'images',
    media_type: 'image',
    badge: 'Ideogram Featured',
    preview_image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Two women in flowing pastel lavender and pale blue dresses, holding hands while walking on a beach at sunset, romantic impressionist oil painting with thick palette-knife impasto, soft pastel colors, gold leaf accents, and dreamy texture, with large painted letters: "BrandVox"',
    model_id: 'p-image-ideogram',
    model_name: 'P-Image Ideogram',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['Painting', 'Oil', 'Impasto', 'Art'],
    uses_count: 5120
  },
  {
    id: 'tpl-art-isometric-room',
    title: '3D Isometric Cyberpunk Room',
    category: 'images',
    media_type: 'image',
    badge: '3D Render',
    preview_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Detailed 3D isometric cutaway view of a cozy cyberpunk developer bedroom, dual glowing curved monitors, potted plants, neon purple LED backlighting, steaming ramen bowl on desk, rainy window in background, Blender Cycles render style',
    model_id: 'p-image-ideogram',
    model_name: 'P-Image Ideogram',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['3D', 'Isometric', 'Blender', 'Cozy'],
    uses_count: 3410
  }
];
