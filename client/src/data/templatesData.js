// client/src/data/templatesData.js
/**
 * Curated catalog of trending viral video and image prompt templates for BrandVox AI
 * Powered by SOTA models: Wan 2.1, MiniMax Hailuo Video-01, Kling v1.6, and FLUX.1 Schnell
 */

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: '🔥 All Trending Templates' },
  { id: 'reels', label: '📱 Viral Reels & TikTok Hooks' },
  { id: 'ecommerce', label: '🛍️ 3D Luxury Product Ads' },
  { id: 'cinematic', label: '🎬 Hollywood Cinema & VFX' },
  { id: 'anime', label: '⛩️ Makoto Shinkai & Anime' },
  { id: 'images', label: '🎨 FLUX.1 8K & Typography' }
];

export const TEMPLATES = [
  // ==========================================
  // 1. VIRAL REELS & TIKTOK HOOKS (9:16 Vertical)
  // ==========================================
  {
    id: 'tpl-reels-cyberpunk-walk',
    title: 'Cyberpunk Tokyo Neon Street Walk',
    category: 'reels',
    media_type: 'video',
    badge: '🔥 Viral Hook (9:16)',
    preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'Vertical 9:16 cinematic slow-motion tracking shot of a mysterious cyberpunk figure in a dark metallic trenchcoat walking through a rain-drenched futuristic Tokyo street, vivid holographic neon reflections on asphalt, volumetric cyan and magenta fog, anamorphic lens, 8k photorealism',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Reel', 'Cyberpunk', 'Neon', 'Trending', 'Wan2.1'],
    uses_count: 8420
  },
  {
    id: 'tpl-reels-fashion-runway',
    title: 'Hyper-Realistic High Fashion Runway Zoom',
    category: 'reels',
    media_type: 'video',
    badge: '💎 Trending Fashion',
    preview_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Ultra-photorealistic vertical 9:16 runway tracking shot, high fashion supermodel walking forward wearing an avant-garde luminescent pleated metallic gown, subtle wind blowing hair, dynamic strobe and rim stage lighting, 60fps cinematic fluidity, shot on Arri Alexa 65',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo Video-01',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Fashion', 'Runway', 'Vogue', 'MiniMax', '4K'],
    uses_count: 6190
  },
  {
    id: 'tpl-reels-dancing-robot',
    title: 'Sleek Humanoid Robot Dance Hook',
    category: 'reels',
    media_type: 'video',
    badge: '🚀 Viral Sound Sync',
    preview_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'Vertical 9:16 smooth camera dolly around a futuristic white and mirror-chrome humanoid robot performing a high-energy fluid dance on a glossy LED studio floor, sharp reflections, neon light pulses synchronized with movement, hyper-realistic mechanical joints',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo Video-01',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['AI Robot', 'Dance', 'TikTok', 'Viral', 'Hailuo'],
    uses_count: 5310
  },
  {
    id: 'tpl-reels-luxury-travel',
    title: 'POV First-Person Amalfi Super-Yacht',
    category: 'reels',
    media_type: 'video',
    badge: '☀️ Luxury Lifestyle',
    preview_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    prompt: 'Vertical 9:16 first-person POV shot stepping onto the sun-drenched teak wood deck of an ultra-luxury superyacht cruising along the dramatic cliffs of Amalfi Coast Italy, crystal turquoise sea waves splashing gently, golden hour Mediterranean sunset lighting, cinematic travel vlog',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Luxury', 'Travel', 'Yacht', 'POV', 'Reel'],
    uses_count: 4890
  },

  // ==========================================
  // 2. 3D LUXURY PRODUCT ADS (E-Commerce)
  // ==========================================
  {
    id: 'tpl-ecom-perfume-splash',
    title: 'Luxury Matte Black Perfume Splash',
    category: 'ecommerce',
    media_type: 'video',
    badge: '🏆 High Converting Ad',
    preview_image_url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Commercial 3D product animation, a luxury square matte-black perfume bottle embossed with embossed metallic gold typography "ELIXIR", rotating in 120fps super slow motion, surrounded by exploding water ripples and crystal droplet splashes against an obsidian reflective pedestal, studio softbox rim lighting',
    model_id: 'kling-video-1-6',
    model_name: 'Kling v1.6 Cinematic',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['ProductAd', 'Perfume', 'Splash', 'Commercial', 'Kling'],
    uses_count: 7340
  },
  {
    id: 'tpl-ecom-cyber-sneaker',
    title: 'Zero-Gravity Cyber-Sneaker Floating Ad',
    category: 'ecommerce',
    media_type: 'video',
    badge: '⚡ Sneakerhead Viral',
    preview_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Commercial advertising video of a futuristic high-top athletic sneaker rotating slowly in zero gravity, glowing neon cyan sole accents, shoelaces untying and hovering weightlessly in mid-air, dynamic camera 360 rotation, dramatic smoky studio background with purple rim light',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Sneakers', 'NikeStyle', 'Product', '3D', 'Wan2.1'],
    uses_count: 6780
  },
  {
    id: 'tpl-ecom-iced-energy-can',
    title: 'Frost & Droplet Chilled Energy Drink Reveal',
    category: 'ecommerce',
    media_type: 'video',
    badge: '🧊 Beverage Commercial',
    preview_image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    prompt: 'Macro commercial shot of a sleek matte black and electric lime aluminium beverage can covered in frosty ice condensation, crisp droplets slowly sliding down the cold metal can, dynamic lighting highlighting the metallic surface, ice cubes bursting upward in slow motion',
    model_id: 'kling-video-1-6',
    model_name: 'Kling v1.6 Cinematic',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Beverage', 'Can', 'Macro', 'Commercial', 'Kling'],
    uses_count: 4210
  },
  {
    id: 'tpl-ecom-diamond-chronograph',
    title: 'Luxury Swiss Chronograph in Molten Gold',
    category: 'ecommerce',
    media_type: 'video',
    badge: '👑 Ultra Luxury',
    preview_image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Cinematic commercial macro shot of a Swiss rose-gold skeleton automatic wristwatch emerging slowly from liquid black oil and molten gold ripples, ticking gears visible through sapphire crystal, flawless macro reflections, premium luxury commercial aesthetic',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo Video-01',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Watch', 'Luxury', 'Gold', 'Macro', 'Commercial'],
    uses_count: 5120
  },

  // ==========================================
  // 3. HOLLYWOOD CINEMA & SCI-FI (16:9)
  // ==========================================
  {
    id: 'tpl-cine-supercar-drift',
    title: 'Midnight Supercar Wet Asphalt Drift',
    category: 'cinematic',
    media_type: 'video',
    badge: '🏎️ Fast & Furious VFX',
    preview_image_url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    prompt: 'Low-angle tracking drone shot of a menacing matte black futuristic hypercar power-sliding aggressively around a wet city hairpin curve at midnight, burning rubber tire smoke illuminated by neon headlights, glowing red taillight streaks, Hollywood blockbuster movie cinematography, IMAX 70mm',
    model_id: 'kling-video-1-6',
    model_name: 'Kling v1.6 Cinematic',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Supercar', 'Drift', 'Cinematic', 'IMAX', 'Kling'],
    uses_count: 9120
  },
  {
    id: 'tpl-cine-interstellar-warp',
    title: 'Interstellar Starship Warp Ignition',
    category: 'cinematic',
    media_type: 'video',
    badge: '🌌 Sci-Fi Masterpiece',
    preview_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    prompt: 'Epic wide cinematic shot of a massive colonial starship igniting twin cobalt-blue fusion warp engines above an alien ocean planet, gigantic cosmic shockwaves rippling through purple planetary rings, blinding lens flare, Hans Zimmer epic cinematic scale',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Space', 'SciFi', 'IMAX', 'Epic', 'Wan2.1'],
    uses_count: 7890
  },
  {
    id: 'tpl-cine-cyber-dragon',
    title: 'Cybernetic Dragon Flying Over Neo-Tokyo',
    category: 'cinematic',
    media_type: 'video',
    badge: '🐉 Mythic Sci-Fi',
    preview_image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    prompt: 'Colossal mechanical cybernetic dragon with glowing cyan circuitry soaring gracefully through storm clouds between neon skyscrapers of a rain-drenched Neo-Tokyo, lightning illuminating titanium scales, volumetric fog and cinematic depth of field',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Dragon', 'Cyberpunk', 'VFX', 'Cinema'],
    uses_count: 6410
  },

  // ==========================================
  // 4. MAKOTO SHINKAI & ANIME SOTA (16:9 & 9:16)
  // ==========================================
  {
    id: 'tpl-anime-shinkai-twilight',
    title: 'Shinjuku Rooftop Twilight Shooting Stars',
    category: 'anime',
    media_type: 'video',
    badge: '⛩️ Makoto Shinkai Style',
    preview_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Breathtaking Makoto Shinkai style anime scene, a young girl standing on a Shinjuku high-rise rooftop at twilight looking up at twin shooting comets crossing a pastel indigo and amber sunset sky, gentle breeze swaying her hair, magical glowing dust particles, vivid emotional lighting, 4K anime masterpiece',
    model_id: 'wan-2-5-fast',
    model_name: 'Wan 2.1 SOTA Video',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Anime', 'Shinkai', 'Sky', 'Ghibli', 'Emotional'],
    uses_count: 11450
  },
  {
    id: 'tpl-anime-samurai-sakura',
    title: 'Samurai Sakura Blade Duel',
    category: 'anime',
    media_type: 'video',
    badge: '⚔️ High-Speed Action',
    preview_image_url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Intense high-voltage anime katana clash in a moonlit misty bamboo grove, two samurai clashing curved steel blades as thousands of luminous pink cherry blossom petals swirl furiously in the vortex, electrical lightning sparks on impact, dynamic camera orbit, Ufotable Demon Slayer animation quality',
    model_id: 'minimax-hailuo',
    model_name: 'MiniMax Hailuo Video-01',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Samurai', 'Anime', 'Action', 'Sakura', 'Katana'],
    uses_count: 8320
  },

  // ==========================================
  // 5. FLUX.1 8K & TYPOGRAPHY IMAGES
  // ==========================================
  {
    id: 'tpl-art-flux-editorial-portrait',
    title: 'FLUX.1 8K Haute Couture Editorial Portrait',
    category: 'images',
    media_type: 'image',
    badge: '📸 FLUX.1 Schnell 8K',
    preview_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Vogue editorial studio portrait of a woman with sculpted cheekbones and high-fashion geometric iridescent eye makeup, captured on Hasselblad H6D-100c, 85mm lens, f/1.4, flawless natural skin pores, dramatic chiaroscuro studio rim lighting, 8k resolution, award winning photography',
    model_id: 'p-image-ideogram',
    model_name: 'FLUX.1 Schnell 8K',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['FLUX', 'Vogue', 'Portrait', 'Photography', '8K'],
    uses_count: 14200
  },
  {
    id: 'tpl-art-neon-typography',
    title: 'Glowing 3D Glass Neon Logo: "BRANDVOX"',
    category: 'images',
    media_type: 'image',
    badge: '🔤 Ideogram Typography',
    preview_image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Hyper-realistic glowing neon typography sign mounted on a dark wet industrial concrete wall, displaying the exact illuminated text "BRANDVOX AI", dual-tone vibrant violet and cyan gas tubes with realistic glass tube glow and wall reflections, cinematic Moody urban atmosphere',
    model_id: 'chatgpt-image',
    model_name: 'Ideogram v2 Typography',
    aspect_ratio: '16:9',
    duration: 0,
    tags: ['Typography', 'Neon', 'Logo', 'Ideogram', 'Sign'],
    uses_count: 12150
  },
  {
    id: 'tpl-art-cozy-isometric-room',
    title: 'Cozy Cyberpunk Lo-Fi Workspace',
    category: 'images',
    media_type: 'image',
    badge: '🛋️ 3D Isometric Render',
    preview_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Detailed 3D isometric cutaway view of a cozy cyberpunk coder bedroom, dual glowing curved ultrawide monitors showing neon code, cascading potted monsteras and succulents, warm amber desk lamp, steaming mug of coffee, rainy cityscape seen through frosted glass window, Blender Octane 3D render style',
    model_id: 'p-image-ideogram',
    model_name: 'FLUX.1 Schnell 8K',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['3D', 'Isometric', 'Blender', 'Cozy', 'FLUX'],
    uses_count: 9800
  }
];
