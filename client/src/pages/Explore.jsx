// client/src/pages/Explore.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import VideoCard from '../components/shared/VideoCard';
import MediaModal from '../components/shared/MediaModal';
import TemplateModal from '../components/shared/TemplateModal';
import { supabase } from '../lib/supabase';
import { useModels } from '../hooks/useModels';
import { TEMPLATES } from '../data/templatesData';
import {
  Image as ImageIcon,
  Sparkles,
  Users,
  Flame,
  ChevronRight,
  Search,
  Compass,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Explore() {
  const navigate = useNavigate();
  const { models } = useModels();
  const [publicVideos, setPublicVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fetchPublicVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicVideos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicVideos();
  }, []);

  // Filter templates by categories
  const trendingTemplates = TEMPLATES.slice(0, 6);
  const swapTemplates = TEMPLATES.filter(t => t.category === 'motion-transfer');
  const ugcTemplates = TEMPLATES.filter(t => t.category === 'ecommerce' || t.category === 'reels');
  const cinematicTemplates = TEMPLATES.filter(t => t.category === 'cinematic' || t.category === 'branding');

  const filteredReels = publicVideos.filter((video) => {
    const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col flex-grow h-full bg-[#000000] text-white overflow-hidden">
      {/* Top Header bar with PRO Wallet Pill */}
      <Topbar title="BrandVox AI" />

      {/* Main Scrollable Catalog Feed */}
      <div className="flex-grow overflow-y-auto pb-24 md:pb-8">
        
        {/* 1. TOP 3 MODE HERO SQUIRCLES (Matches Reference Video 1) */}
        <div className="px-3.5 pt-3 pb-2 max-w-lg md:max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Mode 1: Image to Video */}
            <div
              onClick={() => navigate('/studio', { state: { mode: 'image' } })}
              className="group aspect-[1/1.05] rounded-2xl bg-[#141522] border border-white/8 hover:border-purple-500/40 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-white leading-tight">Image</p>
                <p className="text-[10px] text-white/40 font-semibold leading-tight mt-0.5">to Video</p>
              </div>
            </div>

            {/* Mode 2: Text to Video */}
            <div
              onClick={() => navigate('/studio', { state: { mode: 'video' } })}
              className="group aspect-[1/1.05] rounded-2xl bg-[#141522] border border-white/8 hover:border-indigo-500/40 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-white leading-tight">Text</p>
                <p className="text-[10px] text-white/40 font-semibold leading-tight mt-0.5">to Video</p>
              </div>
            </div>

            {/* Mode 3: Swap to Video (Reference to Video) */}
            <div
              onClick={() => navigate('/studio', { state: { mode: 'swap' } })}
              className="group aspect-[1/1.05] rounded-2xl bg-[#141522] border border-purple-500/25 hover:border-purple-500/50 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md relative overflow-hidden"
            >
              <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[8px] font-black text-purple-300 tracking-wider">
                V2V
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center text-purple-200 group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-black text-white leading-tight">Reference</p>
                <p className="text-[10px] text-purple-300/80 font-bold leading-tight mt-0.5">to Video</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECTION: TRENDING TEMPLATES */}
        <div className="px-3.5 pt-4 pb-2 max-w-lg md:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-['Outfit'] flex items-center gap-1.5">
              <span>Trending</span>
              <Flame className="w-3.5 h-3.5 text-red-500" />
            </h3>
            <button
              onClick={() => navigate('/templates')}
              className="text-xs text-white/40 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {trendingTemplates.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className="group aspect-[9/15] rounded-2xl overflow-hidden relative bg-[#12131D] border border-white/8 hover:border-purple-500/40 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <img
                  src={tpl.preview_image_url}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Hot Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-gradient-hot text-[8.5px] font-black uppercase text-white tracking-wider shadow-sm">
                  HOT
                </div>
                {/* Title Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-[10.5px] font-bold text-white truncate drop-shadow-sm">{tpl.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SECTION: AI CHARACTER SWAP HIGHLIGHTS */}
        <div className="px-3.5 pt-4 pb-2 max-w-lg md:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-['Outfit'] flex items-center gap-1.5">
              <span>Character Motion Swap</span>
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-[9px] font-bold text-purple-300">Kling Omni</span>
            </h3>
            <button
              onClick={() => navigate('/templates')}
              className="text-xs text-white/40 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {swapTemplates.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className="group aspect-[9/15] rounded-2xl overflow-hidden relative bg-[#12131D] border border-white/8 hover:border-purple-500/40 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <img
                  src={tpl.preview_image_url}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-gradient-purple text-[8px] font-black uppercase text-white tracking-wider shadow-sm">
                  PRO
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-[10.5px] font-bold text-white truncate drop-shadow-sm">{tpl.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SECTION: CINEMATIC UGC ADS */}
        <div className="px-3.5 pt-4 pb-2 max-w-lg md:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-['Outfit']">
              UGC & Product Ads
            </h3>
            <button
              onClick={() => navigate('/templates')}
              className="text-xs text-white/40 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {ugcTemplates.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className="group aspect-[9/15] rounded-2xl overflow-hidden relative bg-[#12131D] border border-white/8 hover:border-purple-500/40 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <img
                  src={tpl.preview_image_url}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                  <p className="text-[10.5px] font-bold text-white truncate drop-shadow-sm">{tpl.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. COMMUNITY CREATIONS GRID (with live search) */}
        <div className="px-3.5 pt-5 pb-6 max-w-lg md:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide font-['Outfit'] flex items-center gap-1.5">
              <span>Community Feed</span>
            </h3>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trending styles & prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#12131D] text-xs rounded-xl px-9 py-2.5 border border-white/10 w-full focus:outline-none focus:border-purple-500 text-white placeholder-white/30"
            />
          </div>

          {filteredReels.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/30">
              No public creations found matching your filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredReels.slice(0, 6).map((video) => (
                <div key={video.id} onClick={() => setSelectedMedia(video)} className="cursor-pointer">
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Reel Template Modal (Matches Frame v1_18) */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {/* Community Video Media Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}
