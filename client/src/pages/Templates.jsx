// client/src/pages/Templates.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templatesData';
import { Button } from '../components/ui/Button';
import ImageUploader from '../components/shared/ImageUploader';
import api from '../lib/api';
import { useGeneration } from '../hooks/useGeneration';
import { useAuth } from '../hooks/useAuth';
import {
  Sparkles,
  Search,
  Play,
  Copy,
  ArrowRight,
  X,
  Cpu,
  Layers,
  Check,
  Film,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  Volume2,
  VolumeX,
  Upload,
  Zap,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Templates() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { createSwapGeneration } = useGeneration();

  const [dbTemplates, setDbTemplates] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all'); // 'all' | 'video' | 'image' | 'swap'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 1-Click Viral Recreator Modal State
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');
  const [generatingReel, setGeneratingReel] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  // Fetch dynamic templates from database with resilient fallback
  useEffect(() => {
    let isMounted = true;
    api.get('/templates')
      .then(res => {
        if (isMounted && res.data?.templates && res.data.templates.length > 0) {
          const normalized = res.data.templates.map(t => ({
            ...t,
            media_type: t.media_type || (t.source_video_url ? 'swap' : 'video'),
            prompt: t.prompt_recipe || t.prompt || '',
            tags: t.tags || [t.category, 'Trending', 'Viral']
          }));
          setDbTemplates(normalized);
        }
      })
      .catch(err => {
        console.warn('[Templates] Using built-in catalog fallback:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingDb(false);
      });
    return () => { isMounted = false; };
  }, []);

  const allTemplates = dbTemplates.length > 0 ? dbTemplates : TEMPLATES;

  // Filter templates
  const filteredTemplates = allTemplates.filter((tpl) => {
    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesMedia = selectedMediaType === 'all' || tpl.media_type === selectedMediaType;
    const matchesSearch =
      (tpl.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpl.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpl.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tpl.model_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesMedia && matchesSearch;
  });

  const handleUseTemplateInStudio = (template) => {
    const vidUrl = template.source_video_url || template.preview_video_url;
    navigate('/studio', {
      state: {
        template: {
          id: template.id,
          title: template.title,
          prompt: template.prompt || template.prompt_recipe || '',
          model_id: template.model_id || 'kling-3-omni',
          media_type: template.media_type || (vidUrl ? 'swap' : 'video'),
          aspect_ratio: template.aspect_ratio || '9:16',
          duration: template.duration || 15,
          source_video_url: vidUrl,
          preview_video_url: template.preview_video_url
        }
      }
    });
  };

  const handleCopyPrompt = (e, template) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.prompt || template.prompt_recipe || '');
    setCopiedId(template.id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Reel Recreation Execution
  const handleQuickRecreate = async () => {
    if (!uploadedPhotoUrl) {
      toast.error('Please upload your photo first to recreate this reel!');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate this reel.');
      navigate('/auth');
      return;
    }

    const tpl = activeModalTemplate;
    const vidUrl = tpl.source_video_url || tpl.preview_video_url;

    if (!vidUrl) {
      toast.error('Source motion video is missing for this template.');
      return;
    }

    setGeneratingReel(true);
    const toastId = toast.loading('Initiating Phant-grade 1-click reel recreation...');

    try {
      const payload = {
        source_video_url: vidUrl,
        target_character_url: uploadedPhotoUrl,
        characters: [{ id: 'char-1', target_image_url: uploadedPhotoUrl, label: 'main' }],
        prompt: tpl.prompt || tpl.prompt_recipe || '',
        model_id: tpl.model_id || 'kling-3-omni',
        duration: tpl.duration || 15,
        aspect_ratio: tpl.aspect_ratio || '9:16'
      };

      const res = await createSwapGeneration(payload);
      await refreshProfile();

      if (res?.success && res?.generationId) {
        toast.success('🎉 Reel dispatched! Compiling with original music...', { id: toastId });
        setActiveModalTemplate(null);
        setUploadedPhotoUrl('');

        // Redirect directly to studio to watch generation progress
        navigate('/studio', {
          state: {
            activeGenerationId: res.generationId,
            template: {
              title: tpl.title,
              source_video_url: vidUrl,
              duration: tpl.duration || 15
            }
          }
        });
      } else {
        throw new Error(res?.error || 'Failed to dispatch generation.');
      }
    } catch (err) {
      console.error('1-Click generation error:', err);
      toast.error(err.message || 'Failed to create reel. Check credits.', { id: toastId });
    } finally {
      setGeneratingReel(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      {/* Top Navigation Header */}
      <Topbar title="Trending Viral Reels & Templates" />

      {/* Main Content Scroll Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        
        {/* Banner Hero */}
        <div className="relative rounded-2xl p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary/20 via-purple-900/10 to-transparent border border-white/8 overflow-hidden select-none">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-hover text-[10px] font-black uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>Phant AI-Grade Viral Reel Factory</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide">
              Recreate Any Viral Reel in 1-Click
            </h1>
            <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">
              Pick any viral dance, cinematic strut, or emotional trend below. Upload just 1 photo — our motion-transfer engine swaps your face with 100% original choreography and music preserved!
            </p>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-surface border border-white/5 p-3.5 sm:p-4 rounded-2xl select-none">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar + Media type filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Media type toggle */}
            <div className="flex bg-surface-elevated p-1 rounded-xl border border-white/5 text-[11px] font-bold overflow-x-auto scrollbar-none justify-between sm:justify-start">
              {[
                { id: 'all', label: 'All' },
                { id: 'swap', label: '🎭 Viral Reels' },
                { id: 'video', label: '🎬 AI Cinema' },
                { id: 'image', label: '🎨 Images' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSelectedMediaType(id)}
                  className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedMediaType === id ? 'bg-primary text-white shadow-xs' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:min-w-[200px] md:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="template-search-input"
                name="templateSearch"
                aria-label="Search templates and styles"
                placeholder="Search viral dances, reels, styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-elevated text-xs rounded-xl pl-9 pr-3 py-2 border border-white/10 w-full focus:outline-none focus:border-primary text-white/90"
              />
            </div>
          </div>
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Layers className="w-10 h-10 text-white/20" />
            <h3 className="text-sm font-bold text-white">No viral templates match your search</h3>
            <p className="text-xs text-white/40">Try selecting "All Trending Templates" or clearing your search filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setActiveModalTemplate(template);
                  setUploadedPhotoUrl('');
                }}
                className="group bg-surface border border-white/5 hover:border-primary/40 rounded-2xl overflow-hidden hover-scale transition-all flex flex-col justify-between cursor-pointer shadow-lg relative"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-[9/14] sm:aspect-[9/15] bg-black overflow-hidden">
                  <img
                    src={template.preview_image_url}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Hover video preview with original soundtrack */}
                  {template.preview_video_url && (
                    <video
                      src={template.preview_video_url}
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      onMouseEnter={(e) => e.target.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-primary-hover border border-white/10 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-yellow-400" />
                      {template.badge || 'Viral Reel'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 backdrop-blur-md text-white/70">
                      {template.duration > 0 ? `${template.duration}s` : '15s'}
                    </span>
                  </div>

                  {/* Bottom Overlay on Card */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                    <h3 className="text-sm font-extrabold text-white line-clamp-1 group-hover:text-primary-hover transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5 font-medium">
                      {template.uses_count ? `${template.uses_count.toLocaleString()} creators remixed` : 'Trending Now'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-yellow-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        1-Click Recreate
                      </span>
                      <span className="text-[10px] font-bold text-white/60 group-hover:text-white flex items-center gap-0.5">
                        Use Template ➔
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1-CLICK PHANT AI-GRADE REEL RECREATOR MODAL */}
      {activeModalTemplate && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => setActiveModalTemplate(null)}
        >
          <div 
            className="bg-[#121216] border border-white/15 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-hover">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">{activeModalTemplate.title}</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    {activeModalTemplate.duration || 15}s Full Reel • Sound Synced • {activeModalTemplate.badge || 'Viral Trend'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalTemplate(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 2-Column Reel Recreator Workbench */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 flex-grow">
              
              {/* LEFT: Video Reel Player with Soundtrack */}
              <div className="flex flex-col space-y-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                  <span>Template Source Reel</span>
                  <span className="text-yellow-400 font-bold">100% Motion Lock</span>
                </span>

                <div className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner group">
                  {activeModalTemplate.preview_video_url ? (
                    <video
                      src={activeModalTemplate.preview_video_url}
                      controls
                      autoPlay
                      loop
                      muted={videoMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={activeModalTemplate.preview_image_url}
                      alt={activeModalTemplate.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Sound Toggle Overlay */}
                  {activeModalTemplate.preview_video_url && (
                    <button
                      type="button"
                      onClick={() => setVideoMuted(!videoMuted)}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10"
                      title={videoMuted ? "Unmute Sound" : "Mute Sound"}
                    >
                      {videoMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-primary-hover" />}
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT: Photo Dropzone & 1-Click Launch */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Step Title */}
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-black text-xs text-white shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Drop Your Selfie / Portrait Photo</h4>
                      <p className="text-[10.5px] text-white/50">Our neural engine wraps your face directly onto the dancer/actor.</p>
                    </div>
                  </div>

                  {/* Integrated Image Uploader */}
                  <div className="bg-[#18181D] border border-white/10 rounded-2xl p-3.5 space-y-2">
                    <ImageUploader
                      value={uploadedPhotoUrl}
                      onUrlReady={(url) => setUploadedPhotoUrl(url)}
                      onClear={() => setUploadedPhotoUrl('')}
                      compact={true}
                    />

                    {uploadedPhotoUrl && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Face Ready for Transfer
                        </span>
                        <span className="text-white/40">Preserves original choreography</span>
                      </div>
                    )}
                  </div>

                  {/* Template Highlights */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-surface-elevated p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase font-black block">Original Sound</span>
                      <span className="font-bold text-white mt-0.5 block truncate">Included (Synced)</span>
                    </div>
                    <div className="bg-surface-elevated p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-white/40 uppercase font-black block">Clip Duration</span>
                      <span className="font-bold text-white mt-0.5 block">{activeModalTemplate.duration || 15} Seconds</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="space-y-2.5 pt-3 border-t border-white/10">
                  <Button
                    variant="primary"
                    disabled={!uploadedPhotoUrl || generatingReel}
                    isLoading={generatingReel}
                    onClick={handleQuickRecreate}
                    className="w-full py-3.5 font-extrabold uppercase text-xs tracking-wider shadow-premium flex items-center justify-center gap-2"
                  >
                    {generatingReel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Recreating Viral Reel...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span>Recreate This Reel in 1-Click</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const t = activeModalTemplate;
                        setActiveModalTemplate(null);
                        handleUseTemplateInStudio(t);
                      }}
                      className="text-[11px] text-white/40 hover:text-white underline cursor-pointer"
                    >
                      Open in Advanced Studio (Prompt & Camera)
                    </button>
                    <span className="text-[10px] text-white/30 font-mono">
                      Estimated ~45s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
