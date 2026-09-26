// client/src/data/templatesData.js
/**
 * Curated catalog of trending viral video and image prompt templates for BrandVox AI
 * Powered by SOTA models: Wan 3.0, Kling 3.0 Omni, Google Veo 3, Nano Banana 2.0, and ChatGPT Image 2
 */

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: '🔥 All Trending Templates' },
  { id: 'motion-transfer', label: '🎭 Character Motion Transfer' },
  { id: 'ecommerce', label: '🛍️ Kinetic 3D Product Ads' },
  { id: 'branding', label: '✨ Brand & Logo Reveals' },
  { id: 'reels', label: '📱 Viral Reels & Hooks' },
  { id: 'cinematic', label: '🎬 Hollywood Cinema & VFX' },
  { id: 'anime', label: '⛩️ Makoto Shinkai & Anime' },
  { id: 'images', label: '🎨 8K Realism & Typography' }
];

export const TEMPLATES = [
  // ==========================================
  // 1. CHARACTER MOTION TRANSFER (V2V SWAP)
  // ==========================================
  {
    id: 'tpl-swap-cyberpunk-warrior',
    title: 'Cyberpunk Breakdancer Motion Swap',
    category: 'motion-transfer',
    media_type: 'swap',
    badge: '🎭 V2V Motion Swap',
    preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'Transform the subject into an agile cyberpunk warrior in matte carbon-fiber exo-suit and glowing cyan visor, exact breakdance choreography motion transfer, reflective obsidian floor, volumetric neon arena smoke, 8k photorealistic',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '16:9',
    duration: 10,
    tags: ['Motion Transfer', 'Breakdance', 'Cyberpunk', 'V2V', 'Wan 3.0'],
    uses_count: 14820
  },
  {
    id: 'tpl-swap-samurai-kata',
    title: 'Legendary Ronin Katana Swordmaster',
    category: 'motion-transfer',
    media_type: 'swap',
    badge: '⚔️ V2V Swordplay',
    preview_image_url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Seamless motion transfer, replace actor with an elite wandering Ronin samurai with fluttering black silk haori, glowing katana blade, falling sakura blossoms, cinematic moonlit mist, photorealistic Japanese cinema grade',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '16:9',
    duration: 10,
    tags: ['Samurai', 'Katana', 'Motion Transfer', 'V2V', 'Cinematic'],
    uses_count: 11290
  },
  {
    id: 'tpl-swap-tiktok-chrome-shuffle',
    title: 'Viral TikTok Chrome Android Shuffle',
    category: 'motion-transfer',
    media_type: 'swap',
    badge: '🔥 Viral Choreography',
    preview_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://fxqvuxpybrmkjedaqqrp.supabase.co/storage/v1/object/public/videos/18ac91ae-280a-40dd-9605-433025042f2f/df339c6a-9802-41f9-8b3e-32db5fe38bef.mp4',
    prompt: 'Exact choreography motion transfer, transform dancer into a futuristic metallic chrome android with flowing iridescent neon hair, high-energy shuffle steps preserved, neon strobe club lighting, 60fps fluidity',
    model_id: 'kling-3-omni',
    model_name: 'Kling 3.0 Omni',
    aspect_ratio: '9:16',
    duration: 10,
    tags: ['Shuffle', 'Dance', 'TikTok', 'Android', 'Kling 3.0'],
    uses_count: 9840
  },
  {
    id: 'tpl-swap-superhero-parkour',
    title: 'Tactical Superhero Rooftop Parkour',
    category: 'motion-transfer',
    media_type: 'swap',
    badge: '⚡ V2V Parkour',
    preview_image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Transform parkour athlete into a high-tech tactical vigilante hero with dark navy ballistic armor and crimson energy highlights, exact rooftop vaulting and precision landing motion transfer, sunset skyline, IMAX cinematic look',
    model_id: 'google-veo-3',
    model_name: 'Google Veo 3',
    aspect_ratio: '16:9',
    duration: 10,
    tags: ['Parkour', 'Superhero', 'Action', 'V2V', 'Veo 3'],
    uses_count: 8750
  },

  // ==========================================
  // 2. KINETIC 3D PRODUCT ADS (Higgsfield Style)
  // ==========================================
  {
    id: 'tpl-ecom-kinetic-sneaker',
    title: 'Cyberpunk Kinetic Liquid Splash Sneaker',
    category: 'ecommerce',
    media_type: 'video',
    badge: '👟 3D Kinetic Ad',
    preview_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Commercial 3D kinetic ad, a futuristic limited-edition running sneaker suspended in mid-air, rotating in 120fps super slow motion, surrounded by high-viscosity fluorescent orange liquid splashes and water droplet shockwaves, sleek dark studio lighting, 8k Octane render',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '9:16',
    duration: 8,
    tags: ['Sneakers', 'Product Ad', 'Kinetic', 'E-Commerce', 'Higgsfield'],
    uses_count: 16500
  },
  {
    id: 'tpl-ecom-perfume-splash',
    title: 'Luxury Matte Black & Gold Fragrance',
    category: 'ecommerce',
    media_type: 'video',
    badge: '✨ Luxury 3D Ad',
    preview_image_url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Commercial 3D product animation, a luxury square matte-black perfume bottle embossed with metallic gold typography "ELIXIR", rotating in 120fps super slow motion, surrounded by exploding water ripples and crystal droplet splashes against an obsidian reflective pedestal, studio softbox rim lighting',
    model_id: 'kling-3-omni',
    model_name: 'Kling 3.0 Omni',
    aspect_ratio: '9:16',
    duration: 8,
    tags: ['Perfume', 'Luxury', 'E-Commerce', 'Water', 'Cinematic'],
    uses_count: 13910
  },
  {
    id: 'tpl-ecom-tech-phone-explode',
    title: 'Holographic Titanium Smartphone Unfold',
    category: 'ecommerce',
    media_type: 'video',
    badge: '📱 Kinetic 3D Tech',
    preview_image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    prompt: 'Ultra-sleek 3D product reveal, titanium curved smartphone floating and unfolding in zero-gravity, internal camera lenses exploding outward in clean technical kinetic disassembly and reassembling, neon laser scans, 4k render',
    model_id: 'google-veo-3',
    model_name: 'Google Veo 3',
    aspect_ratio: '16:9',
    duration: 8,
    tags: ['Smartphone', 'Tech Ad', '3D Kinetic', 'Exploded View', 'Veo 3'],
    uses_count: 10420
  },
  {
    id: 'tpl-ecom-beverage-ice-freeze',
    title: 'Frosted Energy Can Kinetic Zero-G Blast',
    category: 'ecommerce',
    media_type: 'video',
    badge: '❄️ Sub-Zero Freeze',
    preview_image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Fast-paced commercial product video, matte metallic cyan slim energy drink can breaking through a sheet of crystal glass in zero gravity, crushed ice cubes and sparkling fizzy condensation flying in macro slow motion, dramatic strobe studio flashes, photorealistic 8k',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Drink', 'Beverage', 'Ice', 'Macro', 'High Energy'],
    uses_count: 9240
  },

  // ==========================================
  // 3. VIRAL BRAND & LOGO REVEALS
  // ==========================================
  {
    id: 'tpl-brand-molten-gold-reveal',
    title: '3D Molten Liquid Gold Typography Reveal',
    category: 'branding',
    media_type: 'video',
    badge: '👑 Molten 3D Reveal',
    preview_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Dramatic 3D brand reveal, glowing molten liquid gold pours smoothly over a dark obsidian stage, pooling and crystallizing into clean bold 3D typography, volumetric golden embers, dramatic rim lighting, cinematic 8k',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '16:9',
    duration: 8,
    tags: ['Logo Reveal', 'Molten Gold', '3D Typography', 'Luxury Brand'],
    uses_count: 12400
  },
  {
    id: 'tpl-brand-cyberpunk-glitch-intro',
    title: 'Cyberpunk Glitch Hologram Brand Intro',
    category: 'branding',
    media_type: 'video',
    badge: '⚡ Glitch Hologram',
    preview_image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'High-octane cyberpunk brand intro, futuristic 3D wireframe logo flickers to life through analog CRT glitch and chromatic aberration waves, morphing into solid polished metallic chrome with cyan laser flares, 60fps',
    model_id: 'kling-3-omni',
    model_name: 'Kling 3.0 Omni',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Glitch', 'Hologram', 'Intro', 'Logo', 'Kling 3.0'],
    uses_count: 10890
  },

  // ==========================================
  // 4. VIRAL REELS & TIKTOK HOOKS (9:16 Vertical)
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
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Reel', 'Cyberpunk', 'Neon', 'Trending', 'Wan 3.0'],
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
    model_id: 'google-veo-3',
    model_name: 'Google Veo 3',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Fashion', 'Runway', 'Vogue', 'Veo 3', '4K'],
    uses_count: 6190
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
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '9:16',
    duration: 6,
    tags: ['Luxury', 'Travel', 'Yacht', 'POV', 'Reel'],
    uses_count: 4890
  },

  // ==========================================
  // 5. HOLLYWOOD CINEMA & VFX (16:9)
  // ==========================================
  {
    id: 'tpl-cine-space-interstellar',
    title: 'Interstellar Gargantua Black Hole Flight',
    category: 'cinematic',
    media_type: 'video',
    badge: '🌌 Hollywood VFX',
    preview_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt: 'Ultra-cinematic 70mm IMAX space tracking shot, a futuristic sleek exploration spacecraft skimming the blinding golden accretion disk of a massive spinning black hole, gravitational lensing bending background starfields, intense lens flares, photorealistic cosmic dust, Hans Zimmer scale cinematography',
    model_id: 'google-veo-3',
    model_name: 'Google Veo 3',
    aspect_ratio: '16:9',
    duration: 10,
    tags: ['Space', 'BlackHole', 'IMAX', 'Sci-Fi', 'Cinema'],
    uses_count: 9800
  },
  {
    id: 'tpl-cine-cyberpunk-dragon',
    title: 'Cyberpunk Neon Dragon Storm Over Neo-Seoul',
    category: 'cinematic',
    media_type: 'video',
    badge: '🐉 Epic VFX Sequence',
    preview_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    prompt: 'Epic movie visual effect shot, a colossal serpentine holographic dragon woven from golden electrical lightning soaring between towering neon skyscrapers of a rain-swept futuristic metropolis, flying police spinners scattering in panic, cinematic slow pan, 8k resolution',
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '16:9',
    duration: 8,
    tags: ['Dragon', 'Cyberpunk', 'VFX', 'Cinema', 'Wan 3.0'],
    uses_count: 6410
  },

  // ==========================================
  // 6. MAKOTO SHINKAI & ANIME SOTA
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
    model_id: 'wan-3',
    model_name: 'Wan 3.0 Realism',
    aspect_ratio: '16:9',
    duration: 6,
    tags: ['Anime', 'Shinkai', 'Sky', 'Ghibli', 'Emotional'],
    uses_count: 11450
  },

  // ==========================================
  // 7. SOTA IMAGE STUDIO & REMIX (8K & TYPOGRAPHY)
  // ==========================================
  {
    id: 'tpl-art-nano-banana-portrait',
    title: 'Nano Banana 2.0 8K Studio Editorial Portrait',
    category: 'images',
    media_type: 'image',
    badge: '📸 Nano Banana 8K',
    preview_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Vogue editorial studio portrait of a woman with sculpted cheekbones and high-fashion geometric iridescent eye makeup, captured on Hasselblad H6D-100c, 85mm lens, f/1.4, flawless natural skin pores, dramatic chiaroscuro studio rim lighting, 8k resolution, award winning photography',
    model_id: 'nano-banana-2',
    model_name: 'Nano Banana 2.0 (FLUX Dev 8K)',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['FLUX Dev', 'Vogue', 'Portrait', 'Photography', '8K'],
    uses_count: 17200
  },
  {
    id: 'tpl-art-chatgpt-image-typography',
    title: 'ChatGPT Image 2 3D Balloon Typography',
    category: 'images',
    media_type: 'image',
    badge: '🔤 Ideogram v2 Remix',
    preview_image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop',
    preview_video_url: null,
    prompt: 'Hyper-realistic glowing neon typography sign mounted on a dark wet industrial concrete wall, displaying the exact illuminated text "BRANDVOX AI", dual-tone vibrant violet and cyan gas tubes with realistic glass tube glow and wall reflections, cinematic moody urban atmosphere',
    model_id: 'chatgpt-image-2',
    model_name: 'ChatGPT Image 2 (Ideogram v2)',
    aspect_ratio: '16:9',
    duration: 0,
    tags: ['Typography', 'Neon', 'Logo', 'Ideogram', 'Sign'],
    uses_count: 15150
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
    model_id: 'nano-banana-2',
    model_name: 'Nano Banana 2.0 (FLUX Dev 8K)',
    aspect_ratio: '1:1',
    duration: 0,
    tags: ['3D', 'Isometric', 'Blender', 'Cozy', 'FLUX'],
    uses_count: 9800
  }
];
