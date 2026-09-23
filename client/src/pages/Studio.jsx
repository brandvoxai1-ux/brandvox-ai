// client/src/pages/Studio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGeneration } from '../hooks/useGeneration';
import { useModels } from '../hooks/useModels';
import { useCredits } from '../hooks/useCredits';
import api from '../lib/api';
import { formatCredits } from '../lib/utils';
import Topbar from '../components/layout/Topbar';
import ModelCard from '../components/shared/ModelCard';
import VideoCard from '../components/shared/VideoCard';
import CreditDisplay from '../components/shared/CreditDisplay';
import ImageUploader from '../components/shared/ImageUploader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import {
  Film,
  Sparkles,
  Play,
  Settings,
  HelpCircle,
  Clock,
  X,
  RefreshCw,
  FolderOpen,
  Search,
  ChevronRight,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Studio() {
  const location = useLocation();
  const { profile, refreshProfile } = useAuth();
  const { models } = useModels();
  const { buyCredits } = useCredits();
  const {
    createGeneration,
    createImageGeneration,
    getStatus,
    deleteGeneration,
    updateGeneration
  } = useGeneration();

  // Left panel states
  const [activeMode, setActiveMode] = useState('video'); // 'video' | 'image'
  const [selectedModel, setSelectedModel] = useState(null);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(6);
  const [modelSearch, setModelSearch] = useState('');
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const modelPickerRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');

  // Topbar and Canvas state
  const [projectTitle, setProjectTitle] = useState('My BrandVox Reel');
  const [activeCanvasTab, setActiveCanvasTab] = useState('editor'); // 'editor' | 'queue' | 'history'

  // Close model picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target)) {
        setModelPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prompt Area state
  const [promptText, setPromptText] = useState('');
  const promptRef = useRef(null);

  // Handle incoming template preloading from /templates
  useEffect(() => {
    if (location.state?.template) {
      const t = location.state.template;
      if (t.prompt) setPromptText(t.prompt);
      if (t.aspect_ratio) setAspectRatio(t.aspect_ratio);
      if (t.duration) setDuration(t.duration);
      if (t.media_type) setActiveMode(t.media_type);
      if (t.model_id && models.length > 0) {
        const found = models.find(m => m.id === t.model_id || m.fal_endpoint === t.model_id);
        if (found) setSelectedModel(found);
      }
      toast.success(`✨ Loaded template: "${t.title || 'Creative Preset'}"`);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, models]);

  // Active playing video (Editor Canvas)
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Active image generation result (image mode)
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('idle'); // 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  const [generationError, setGenerationError] = useState('');
  
  // Lists
  const [recentVideos, setRecentVideos] = useState([]);
  const [queueVideos, setQueueVideos] = useState([]);
  const [historyVideos, setHistoryVideos] = useState([]);
  const [watermarkRequired, setWatermarkRequired] = useState(true);

  // Default select first active model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel]);

  // Handle Model change filters
  useEffect(() => {
    if (selectedModel) {
      // Auto adjust aspect options
      if (!selectedModel.supported_aspects?.includes(aspectRatio)) {
        setAspectRatio(selectedModel.supported_aspects?.[0] || '16:9');
      }
      // Auto adjust resolution
      if (!selectedModel.supported_resolutions?.includes(resolution)) {
        setResolution(selectedModel.supported_resolutions?.[0] || '720p');
      }
      // Adjust duration limit
      if (duration > selectedModel.max_duration) {
        setDuration(selectedModel.max_duration);
      }
    }
  }, [selectedModel]);

  // Synchronize dynamic collections
  const loadStudioData = async () => {
    if (!profile?.id) return;
    try {
      const res = await api.get('/generate?page=1&limit=20');
      
      const allVideos = res.data.generations || [];
      setWatermarkRequired(res.data.watermarkRequired);
      setHistoryVideos(allVideos);

      // Extract queue
      const queue = allVideos.filter(v => v.status === 'pending' || v.status === 'processing');
      setQueueVideos(queue);

      // Extract recent completed
      const completed = allVideos.filter(v => v.status === 'completed');
      setRecentVideos(completed.slice(0, 5));

      // Auto-load most recent completed video in Editor if idle
      if (completed.length > 0 && !activeVideo && generationStatus === 'idle') {
        setActiveVideo(completed[0]);
      }
    } catch (err) {
      console.error('Failed to sync studio data:', err);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [profile?.id, generationStatus]);

  // Auto select model when mode changes if current selected model doesn't match mode
  useEffect(() => {
    if (models.length > 0) {
      const modeModels = models.filter(m => (activeMode === 'image' ? m.model_type === 'image' : m.model_type !== 'image'));
      if (modeModels.length > 0 && (!selectedModel || selectedModel.model_type !== (activeMode === 'image' ? 'image' : 'video'))) {
        setSelectedModel(modeModels[0]);
      }
    }
  }, [activeMode, models]);

  // Cost calculation
  const getEstimatedCost = () => {
    if (!selectedModel) return 0;
    if (selectedModel.model_type === 'image') {
      return parseFloat(selectedModel.base_cost || 5);
    }
    return duration * parseFloat(selectedModel.price_per_second);
  };

  const cost = getEstimatedCost();
  const insufficientCredits = (profile?.credits || 0) < cost;

  // Poll processing jobs
  useEffect(() => {
    if (!activeGenerationId) return;

    setGenerationStatus('pending');
    setGenerationProgress(10);
    
    let interval = setInterval(async () => {
      try {
        const res = await getStatus(activeGenerationId);
        
        if (res.status === 'processing') {
          setGenerationStatus('processing');
          setGenerationProgress(p => Math.min(90, p + 5)); // Simulate incremental loading
        } else if (res.status === 'completed') {
          setGenerationStatus('completed');
          setGenerationProgress(100);
          setActiveGenerationId(null);
          toast.success('AI Video compiled successfully!');
          await refreshProfile();
          await loadStudioData();
          
          // Load generated asset directly to video panel
          const completeDetails = await api.get(`/generate/${res.id || activeGenerationId}`);
          setActiveVideo(completeDetails.data);
          setGenerationStatus('idle');
        } else if (res.status === 'failed') {
          setGenerationStatus('failed');
          setGenerationError(res.error_message || 'API request timeout.');
          setActiveGenerationId(null);
          toast.error('AI compilation failed. Cost refunded.');
          await refreshProfile();
          await loadStudioData();
        }
      } catch (err) {
        console.error('Polling check failed:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGenerationId]);

  // Prompt Templates Categories
  const promptTemplates = [
    { label: '🎬 Cinematic', text: 'Cinematic tracking shot of a futuristic cyberpunk cityscape at night, neon reflections in puddles, atmospheric fog, detailed architecture, photorealistic 8k.' },
    { label: '🌿 Nature', text: 'Epic slow motion drone sweep across lush tropical waterfalls cascading into crystal lagoons, hyperrealistic moss, golden hour lighting.' },
    { label: '🚗 Product', text: 'Dynamic studio zoom on a sleek metallic sports car, smoke effects, high contrast studio lights flashing, slow dramatic pan, 4k.' },
    { label: '🎨 Abstract', text: 'Vibrant fluid simulation of glowing colorful paints swirling inside zero-gravity, cosmic stardust particle elements, slow morph.' }
  ];

  // Dispatch Generation job
  const handleGenerate = async () => {
    if (!promptText.trim()) {
      toast.error('Prompt description is empty.');
      return;
    }

    if (!selectedModel) {
      toast.error('No AI Model selected.');
      return;
    }

    if (activeMode === 'video' && imageUrl && !selectedModel?.supports_image_input) {
      toast.error('The selected model does not support image input. Remove the image or switch to an image-to-video model.');
      return;
    }

    if (insufficientCredits) {
      toast.error('Insufficient credits. Purchase more credits.');
      return;
    }

    // IMAGE MODE — call synchronous image endpoint
    if (activeMode === 'image') {
      try {
        setImageGenerating(true);
        setActiveImageUrl(null);
        const res = await createImageGeneration({
          prompt: promptText,
          model_id: selectedModel.id,
          aspect_ratio: aspectRatio
        });
        if (res.success && res.image_url) {
          setActiveImageUrl(res.image_url);
          await refreshProfile();
          toast.success('Image generated!');
        }
      } catch (err) {
        toast.error(err.message || 'Image generation failed.');
      } finally {
        setImageGenerating(false);
      }
      return;
    }

    // VIDEO MODE
    try {
      setGenerationStatus('pending');
      setGenerationError('');
      setActiveCanvasTab('editor');
      
      const payload = {
        prompt: promptText,
        model_id: selectedModel.id,
        duration: duration,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        generate_audio: !!selectedModel?.supports_audio,
        image_url: imageUrl || null
      };

      const res = await createGeneration(payload);
      
      if (res.success && res.generationId) {
        setActiveGenerationId(res.generationId);
        toast.loading('Initiating server GPU dispatch...', { id: 'gen-dispatch' });
        setTimeout(() => toast.dismiss('gen-dispatch'), 2000);
      }
    } catch (err) {
      setGenerationStatus('idle');
      toast.error(err.message || 'Generation failed to submit.');
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleShortcuts = (e) => {
      // Ctrl + Enter to generate
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
      // Ctrl + K to focus prompt
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        promptRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [promptText, selectedModel, duration, resolution, aspectRatio, imageUrl, insufficientCredits]);

  return (
    <div className="flex flex-grow h-screen overflow-hidden bg-darkBg text-white">
      
      {/* PANEL 2: LEFT CONTROL PANEL (220px wide) */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-white/5 p-4 overflow-y-auto shrink-0 select-none justify-between space-y-6 relative">
        <div className="space-y-5">
          {/* Top-level creator mode: Video | Image */}
          <div className="flex bg-surface-elevated p-0.5 rounded-lg border border-white/5 text-[10px] font-bold uppercase tracking-wider">
            {[
              { id: 'video', label: 'Video', icon: Film },
              { id: 'image', label: 'Image', icon: Sparkles }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveMode(id); setImageUrl(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  activeMode === id ? 'bg-primary text-white shadow-xs' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* MEDIA UPLOAD — Only in Video mode */}
          {activeMode === 'video' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Media</label>
                {imageUrl && (
                  <button
                    onClick={() => setImageUrl('')}
                    className="text-[9px] text-error/70 hover:text-error font-bold uppercase tracking-wider transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {imageUrl ? (
                /* Preview of attached image */
                <div className="relative rounded-xl overflow-hidden border border-white/8 aspect-video bg-black">
                  <img src={imageUrl} alt="Source" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/70 uppercase tracking-wider">
                    Image→Video
                  </div>
                </div>
              ) : (
                /* Upload zone */
                <ImageUploader
                  value={imageUrl}
                  onUrlReady={(url) => setImageUrl(url)}
                  onClear={() => setImageUrl('')}
                  compact
                />
              )}
            </div>
          )}

          {/* MODEL SELECTOR — Available in both Video and Image modes */}
          <div className="space-y-1.5" ref={modelPickerRef}>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Model</label>

            {/* Trigger row */}
            <button
              onClick={() => setModelPickerOpen(o => !o)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group ${
                modelPickerOpen
                  ? 'bg-white/8 border-primary/40 ring-1 ring-primary/20'
                  : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-primary/20 text-primary-hover flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[11px] font-bold text-white truncate leading-none">
                    {selectedModel ? selectedModel.name : 'Select a model'}
                  </p>
                  {selectedModel && (
                    <p className="text-[9px] text-white/40 font-bold mt-0.5 uppercase tracking-wider">
                      {selectedModel.model_type === 'image'
                        ? `₹${selectedModel.base_cost} per image`
                        : `${selectedModel.supported_resolutions?.slice(-1)[0]?.toUpperCase()} · 4s–${selectedModel.max_duration}s`
                      }
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-white/30 transition-transform shrink-0 ${
                modelPickerOpen ? 'rotate-90' : ''
              }`} />
            </button>

            {/* Floating dropdown */}
            {modelPickerOpen && (
              <div className="absolute left-0 right-0 z-50 mx-2 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-2.5 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/8 rounded-lg text-[10px] text-white/80 placeholder-white/30 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                  <Sparkles className="w-2.5 h-2.5 text-primary/50" />
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                    {activeMode === 'image' ? 'Image Models' : 'Video Models'}
                  </span>
                </div>
                <div className="pb-2 max-h-60 overflow-y-auto">
                  {models
                    .filter(m => (activeMode === 'image' ? m.model_type === 'image' : (m.model_type || 'video') !== 'image'))
                    .filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                    .map((model) => {
                      const isSelected = selectedModel?.id === model.id;
                      const topRes = model.supported_resolutions?.slice(-1)[0]?.toUpperCase() || '720P';
                      return (
                        <button
                          key={model.id}
                          onClick={() => { setSelectedModel(model); setModelSearch(''); setModelPickerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 transition-colors cursor-pointer ${
                            isSelected ? 'bg-white/8' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary/20 text-primary-hover' : 'bg-white/6 text-white/40'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-white/75'}`}>
                                {model.name}
                              </span>
                              {model.badge && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary-hover border border-primary/20 leading-none">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {model.model_type === 'image' ? (
                                <span className="text-[9px] text-white/35 font-bold">₹{model.base_cost} flat</span>
                              ) : (
                                <>
                                  <span className="text-[9px] text-white/35 font-bold">{topRes}</span>
                                  <span className="text-white/15 text-[9px]">·</span>
                                  <span className="text-[9px] text-white/35 font-bold">4s–{model.max_duration}s</span>
                                </>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-hover shrink-0" />}
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>

          {/* OUTPUT SETTINGS */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Output settings</label>
            
            {/* Resolution dropdown (video only) */}
            {activeMode === 'video' && (
              <Select
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                options={
                  selectedModel?.supported_resolutions?.map((r) => ({ value: r, label: r.toUpperCase() })) || [
                    { value: '720p', label: '720P' }
                  ]
                }
              />
            )}

            {/* Aspect dropdown (video + image) */}
            <Select
              label="Aspect Ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              options={
                selectedModel?.supported_aspects?.map((a) => ({ value: a, label: a })) || [
                  { value: '16:9', label: '16:9' }
                ]
              }
            />

            {/* Discrete Duration Selector (video only) */}
            {activeMode === 'video' && (
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-white/50 tracking-wider">
                  <span>Duration</span>
                  <span className="text-primary-hover font-black">{duration}s</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/8">
                  {[4, 6, 8, 10].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={selectedModel?.max_duration && sec > selectedModel.max_duration}
                      onClick={() => setDuration(sec)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        duration === sec
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      } ${selectedModel?.max_duration && sec > selectedModel.max_duration ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio indicator (video only) */}
            {activeMode === 'video' && selectedModel?.supports_audio && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider">Audio generation included</span>
              </div>
            )}
          </div>

        </div>

        {/* Dynamic Cost Estimator */}
        <div className="bg-surface-elevated p-3 rounded-xl border border-white/5 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <span>Estimated Cost</span>
            <span className={insufficientCredits ? 'text-error font-black' : 'text-primary-hover font-black'}>
              {formatCredits(cost)}
            </span>
          </div>
          
          <div className="text-[10px] text-white/35 font-bold uppercase tracking-wider">
            Balance: <span className="text-white font-extrabold">{formatCredits(profile?.credits || 0)}</span>
          </div>

          {insufficientCredits && (
            <p className="text-[9px] font-semibold text-error/80 leading-relaxed pt-1">
              ⚠️ Insufficient credits. Tap purchase.
            </p>
          )}
        </div>
      </aside>

      {/* PANEL 3: MIDDLE CANVAS CONTAINER (Fills space) */}
      <section className="flex flex-col flex-grow h-full bg-darkBg overflow-hidden">
        
        {/* Canvas Header bar */}
        <Topbar
          title={projectTitle}
          onRename={setProjectTitle}
          activeTab={activeCanvasTab}
          setActiveTab={setActiveCanvasTab}
          tabs={[
            { id: 'editor', label: 'Editor' },
            { id: 'queue', label: 'Queue' },
            { id: 'history', label: 'History' }
          ]}
          actionButton={
            <Button
              variant="primary"
              size="md"
              disabled={
                !promptText.trim() ||
                insufficientCredits ||
                (activeMode === 'image' ? imageGenerating : generationStatus !== 'idle')
              }
              onClick={handleGenerate}
              className="shadow-premium uppercase font-extrabold text-xs tracking-wider"
            >
              {activeMode === 'image'
                ? (imageGenerating ? 'Generating Image...' : 'Generate Image')
                : (generationStatus !== 'idle' ? 'Generating Video...' : 'Generate Video')
              }
            </Button>
          }
        />

        {/* Middle Canvas workspace area */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col justify-between space-y-6">
          
          {/* Active Canvas Tabs Panels */}
          <div className="flex-grow flex items-center justify-center">
            {activeCanvasTab === 'editor' && (
              <div className="w-full max-w-xl aspect-video glass-premium rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden relative shadow-premium">
                
                {/* IMAGE MODE CANVAS */}
                {activeMode === 'image' ? (
                  imageGenerating ? (
                    <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-primary-hover animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">Generating High-Detail Image</h4>
                        <p className="text-[10.5px] text-white/45 mt-1 font-semibold uppercase tracking-wider">
                          Running {selectedModel?.name} on Replicate GPU...
                        </p>
                      </div>
                    </div>
                  ) : activeImageUrl ? (
                    <div className="relative w-full h-full group flex items-center justify-center bg-black">
                      <img
                        src={activeImageUrl}
                        alt="Generated result"
                        className="w-full h-full object-contain"
                      />
                      <a
                        href={activeImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm border border-white/15 rounded-lg text-xs font-bold text-white transition-colors"
                      >
                        Download Image
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-full text-primary-hover animate-pulse">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-wide">Image preview canvas</h4>
                      <p className="text-xs text-white/50 max-w-xs leading-relaxed font-semibold">
                        Describe your vision below and select an image model ({selectedModel?.name || 'Nano Banana'}) to create artwork.
                      </p>
                    </div>
                  )
                ) : (
                  /* VIDEO MODE CANVAS */
                  generationStatus === 'pending' || generationStatus === 'processing' ? (
                    /* Processing compilation frame */
                    <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-primary-hover animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">Compiling Cinematic Frames</h4>
                        <p className="text-[10.5px] text-white/45 mt-1 font-semibold uppercase tracking-wider">
                          Running {selectedModel?.name} pipeline in background...
                        </p>
                      </div>
                      <div className="w-64">
                        <ProgressBar value={generationProgress} showGlow />
                      </div>
                    </div>
                  ) : generationStatus === 'failed' ? (
                    /* Generation Failure frame */
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <X className="w-10 h-10 text-error p-2 bg-error/15 rounded-full border border-error/25 animate-bounce" />
                      <h4 className="text-sm font-extrabold text-error">AI Synthesis Disrupted</h4>
                      <p className="text-xs text-white/50 max-w-sm leading-relaxed">{generationError}</p>
                      <Button variant="secondary" size="sm" onClick={() => setGenerationStatus('idle')}>
                        Try Again
                      </Button>
                    </div>
                  ) : activeVideo ? (
                    /* Active video playing VLC Frame */
                    <div className="relative w-full h-full group">
                      <video
                        src={activeVideo.video_url}
                        controls
                        autoPlay
                        playsInline
                        loop
                        className="w-full h-full object-cover"
                      />

                      {/* Dynamic Premium Watermark Overlay for free accounts */}
                      {watermarkRequired && (
                        <>
                          <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-black uppercase text-primary pointer-events-none select-none tracking-widest z-20 animate-pulse">
                            BrandVox AI Free
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                            <span className="text-white/10 text-4xl font-black uppercase tracking-widest -rotate-25 whitespace-nowrap">
                              BrandVox AI
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Default Empty Canvas state */
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-full text-primary-hover animate-pulse">
                        <Film className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-wide">Video preview canvas</h4>
                      <p className="text-xs text-white/50 max-w-xs leading-relaxed font-semibold">
                        Describe your concept below and trigger generation to render your cinematic reel.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {activeCanvasTab === 'queue' && (
              <div className="w-full max-w-xl space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span>My Active Generation Queue ({queueVideos.length})</span>
                </h3>
                {queueVideos.length === 0 ? (
                  <div className="text-center bg-surface border border-white/5 rounded-xl p-10 text-xs text-white/30 tracking-wider">
                    No active compilations in queue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueVideos.map((video) => (
                      <div key={video.id} className="bg-surface p-4 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white truncate max-w-[200px]">{video.title}</span>
                            <Badge variant="warning">{video.status}</Badge>
                          </div>
                          <p className="text-[10px] text-white/40 max-w-sm truncate">{video.prompt}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeCanvasTab === 'history' && (
              <div className="w-full max-w-2xl">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center">
                  <FolderOpen className="w-4.5 h-4.5 mr-1.5 text-primary" />
                  <span>Generations History ({historyVideos.length})</span>
                </h3>
                {historyVideos.length === 0 ? (
                  <div className="text-center bg-surface border border-white/5 rounded-xl p-10 text-xs text-white/30 tracking-wider">
                    Your history logs are empty.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                    {historyVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        watermarkRequired={watermarkRequired}
                        onPlay={setActiveVideo}
                        onDelete={async (id) => {
                          await deleteGeneration(id);
                          await loadStudioData();
                          if (activeVideo?.id === id) setActiveVideo(null);
                        }}
                        onToggleShare={async (id, state) => {
                          await updateGeneration(id, { is_public: state });
                          await loadStudioData();
                        }}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Core Prompt input tray (always visible on Panel 3 bottom) */}
          <div className="w-full max-w-2xl mx-auto space-y-3.5 bg-surface border border-white/5 p-4 rounded-2xl select-none shadow-premium">
            
            {/* Quick Templates Categories */}
            <div className="flex items-center space-x-2 overflow-x-auto pr-1 pb-1">
              <span className="text-[9px] font-black uppercase text-white/35 tracking-wider shrink-0">Tips:</span>
              {promptTemplates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPromptText(t.text)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-primary hover:text-white rounded-md text-[10px] font-bold text-white/60 transition-colors shrink-0 cursor-pointer border border-white/5"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                ref={promptRef}
                placeholder="Describe your scene in rich detail — movements, actions, camera shifts, and moody lighting..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                maxLength="500"
                rows="3"
                className="w-full bg-surface-elevated text-xs rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-primary text-white resize-none placeholder-white/20"
              />
              <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white/25">
                {promptText.length}/500
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold uppercase tracking-wider">
              <span>💡 Include camera pans, style keywords, and lighting for pristine renders</span>
              <span>Ctrl+Enter to compile</span>
            </div>
          </div>
        </div>
      </section>

      {/* PANEL 4: RIGHT DETAIL WIDGETS PANEL (200px wide) */}
      <aside className="hidden xl:flex flex-col w-52 bg-surface border-l border-white/5 p-4 overflow-y-auto shrink-0 select-none space-y-6 justify-between">
        <div className="space-y-6">
          {/* Credit balance display */}
          <CreditDisplay credits={profile?.credits || 0} lastCost={cost} />

          {/* Quick Recent items */}
          <div className="space-y-3.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Recent Creations</label>
            {recentVideos.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-[10px] text-white/30 tracking-wider uppercase font-bold">
                No videos ready
              </div>
            ) : (
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      setActiveVideo(video);
                      setActiveCanvasTab('editor');
                    }}
                    className="flex items-center space-x-2.5 p-2 bg-surface-elevated hover:bg-surface-hover border border-white/5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="w-12 aspect-video bg-black rounded-lg overflow-hidden shrink-0 relative">
                      <Play className="w-3.5 h-3.5 text-white/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="truncate space-y-0.5">
                      <h4 className="text-[10.5px] font-bold text-white truncate">{video.title}</h4>
                      <p className="text-[9px] text-white/40 uppercase font-bold">{video.duration}s</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global info controls */}
        <div className="flex items-center justify-around text-[10.5px] text-white/40 border-t border-white/5 pt-4">
          <button className="hover:text-white flex items-center space-x-1 cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </button>
          <span>•</span>
          <button className="hover:text-white flex items-center space-x-1 cursor-pointer">
            <Settings className="w-3.5 h-3.5" />
            <span>Docs</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
