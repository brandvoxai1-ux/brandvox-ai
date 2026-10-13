// client/src/pages/Studio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
import VideoUploader from '../components/shared/VideoUploader';
import UnifiedMediaUploader from '../components/shared/UnifiedMediaUploader';
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
  XCircle,
  RefreshCw,
  FolderOpen,
  Search,
  ChevronRight,
  Check,
  UserCheck,
  ShieldCheck,
  Video as VideoIcon,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Plus,
  Trash2,
  Users,
  Camera
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
    createSwapGeneration,
    getStatus,
    deleteGeneration,
    updateGeneration,
    cancelGeneration
  } = useGeneration();

  // Left panel states — Synchronously initialize from location.state or query param to prevent mode flash
  const [activeMode, setActiveMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const paramMode = params.get('mode');
    if (paramMode && ['video', 'swap', 'image'].includes(paramMode)) return paramMode;
    if (location.state?.mediaType && ['video', 'swap', 'image'].includes(location.state.mediaType)) return location.state.mediaType;
    if (location.state?.remixMedia?.generation_type && ['video', 'swap', 'image'].includes(location.state.remixMedia.generation_type)) return location.state.remixMedia.generation_type;
    if (location.state?.template?.media_type) return location.state.template.media_type;
    return 'video';
  });
  const [selectedModel, setSelectedModel] = useState(null);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState(() => {
    return location.state?.remixMedia?.aspect_ratio || location.state?.template?.aspect_ratio || '16:9';
  });
  const [duration, setDuration] = useState(() => {
    return Number(location.state?.remixMedia?.duration || location.state?.template?.duration) || 6;
  });
  const [generateAudio, setGenerateAudio] = useState(true);
  const [mediaDimensions, setMediaDimensions] = useState(null); // { width, height, ratio }
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const videoPlayerRef = useRef(null);
  const [modelSearch, setModelSearch] = useState('');
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const modelPickerRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(''); // Target character image or Image-to-Video source
  const [sourceVideoUrl, setSourceVideoUrl] = useState(() => {
    return location.state?.remixMedia?.video_url || '';
  }); // Character Swap source motion video
  const [remixImageUrl, setRemixImageUrl] = useState(() => {
    if (location.state?.mediaType === 'image' || location.state?.remixMedia?.generation_type === 'image') {
      return location.state?.remixMedia?.video_url || '';
    }
    return '';
  }); // Image-to-Image remix reference photo
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false); // Mobile slide-up drawer
  const [propImageUrl, setPropImageUrl] = useState(''); // Optional Object/Prop ingredient
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Higgsfield Unified Media Assets state
  const [mediaAssets, setMediaAssets] = useState(() => {
    const list = [];
    if (location.state?.remixMedia?.video_url) {
      list.push({
        id: 'initial_video',
        type: 'video',
        tag: '@Video1',
        url: location.state.remixMedia.video_url,
        name: 'Source Motion Video'
      });
    }
    return list;
  });

  const handleMediaAssetsChange = (newAssets) => {
    setMediaAssets(newAssets);
    const vid = newAssets.find(a => a.type === 'video');
    const img = newAssets.find(a => a.type === 'image');
    setSourceVideoUrl(vid ? vid.url : '');
    setImageUrl(img ? img.url : '');
    if (img) {
      setSwapCharacters([{ id: 'char-1', target_image_url: img.url, label: '' }]);
    } else {
      setSwapCharacters([]);
    }
    if (vid) {
      if (vid.duration && !isNaN(vid.duration)) {
        const naturalDur = Math.round(vid.duration);
        const maxForModel = Number(selectedModel?.max_duration) || 10;
        const clampedDur = Math.max(3, Math.min(maxForModel, naturalDur));
        setDuration(clampedDur);
        if (naturalDur > maxForModel) {
          toast(`Source video is ${naturalDur}s: auto-trimmed to ${maxForModel}s (${selectedModel?.name || 'AI'} tensor limit)`, { icon: '⏱️', duration: 3500 });
        } else {
          toast(`Detected source video length: ${clampedDur}s`, { icon: '⏱️', duration: 2500 });
        }
      }
    }
    if (vid && img) {
      setActiveMode('swap');
    } else if (img && !vid) {
      setActiveMode('video');
    }
  };

  const cameraPresets = [
    { id: 'dolly', label: '🎥 Dolly Push', text: 'cinematic slow dolly push-in' },
    { id: 'orbit', label: '🔄 360 Orbit', text: 'smooth 360 rotational orbit around subject' },
    { id: 'pan', label: '↔️ Pan', text: 'fluid horizontal camera pan' },
    { id: 'wide', label: '📐 Wide Pullback', text: 'dramatic wide-angle pullback reveal' },
    { id: 'crane', label: '⬆️ Crane Up', text: 'sweeping vertical crane elevation shot' }
  ];

  const handleToggleCamera = (preset) => {
    if (selectedCamera === preset.id) {
      setSelectedCamera(null);
      setPromptText(prev => prev.replace(new RegExp(`,?\\s*${preset.text}`, 'gi'), '').trim());
    } else {
      const prevPreset = cameraPresets.find(c => c.id === selectedCamera);
      let updated = promptText;
      if (prevPreset) {
        updated = updated.replace(new RegExp(`,?\\s*${prevPreset.text}`, 'gi'), '').trim();
      }
      setSelectedCamera(preset.id);
      setPromptText(updated ? `${updated}, ${preset.text}` : preset.text);
    }
  };

  // Multi-Character Swap state (supports 1 to 5 characters with role labels)
  const [swapCharacters, setSwapCharacters] = useState(() => {
    const initUrl = location.state?.remixMedia?.input_image_url || '';
    return [{ id: 'char-1', target_image_url: initUrl, label: '' }];
  });

  const handleAddCharacter = () => {
    if (swapCharacters.length >= 5) {
      toast.error('Maximum 5 characters allowed per video.');
      return;
    }
    const newId = `char-${Date.now()}`;
    setSwapCharacters(prev => [
      ...prev,
      { id: newId, target_image_url: '', label: '' }
    ]);
  };

  const handleRemoveCharacter = (idToRemove) => {
    if (swapCharacters.length <= 1) {
      setSwapCharacters([{ id: 'char-1', target_image_url: '', label: '' }]);
      setImageUrl('');
      return;
    }
    setSwapCharacters(prev => {
      const filtered = prev.filter(c => c.id !== idToRemove);
      if (filtered[0]?.target_image_url !== imageUrl) {
        setImageUrl(filtered[0]?.target_image_url || '');
      }
      return filtered;
    });
  };

  const handleUpdateCharacter = (id, field, value) => {
    setSwapCharacters(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    }));
    if (field === 'target_image_url' && swapCharacters[0]?.id === id) {
      setImageUrl(value);
    }
  };

  // AI Prompt Enhancer state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [adStyle, setAdStyle] = useState('ad-commercial');

  // Topbar and Canvas state
  const [projectTitle, setProjectTitle] = useState(() => {
    if (location.state?.remixMedia?.title) return `Remix: ${location.state.remixMedia.title}`;
    if (location.state?.template?.title) return location.state.template.title;
    return 'My BrandVox Reel';
  });
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
  const [promptText, setPromptText] = useState(() => {
    return location.state?.remixMedia?.prompt || location.state?.template?.prompt || location.state?.remixPrompt || location.state?.prompt || '';
  });
  const promptRef = useRef(null);

  // Active playing video (Editor Canvas)
  const [activeVideo, setActiveVideo] = useState(() => {
    return location.state?.remixMedia || null;
  });
  
  // Active image generation result (image mode)
  const [activeImageUrl, setActiveImageUrl] = useState(() => {
    if (location.state?.mediaType === 'image' || location.state?.remixMedia?.generation_type === 'image') {
      return location.state?.remixMedia?.video_url || null;
    }
    return null;
  });
  const [imageGenerating, setImageGenerating] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState(null);
  const [failedGenId, setFailedGenId] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('idle'); // 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  const [generationError, setGenerationError] = useState('');
  const hasLoadedRemixRef = useRef(Boolean(location.state?.remixMedia));

  // Handle incoming template or remix data from Navigation (Templates or Explore pages)
  useEffect(() => {
    if (location.state?.template) {
      const tpl = location.state.template;
      if (tpl.prompt) setPromptText(tpl.prompt);
      if (tpl.title) setProjectTitle(tpl.title);
      if (tpl.aspect_ratio) setAspectRatio(tpl.aspect_ratio);
      if (tpl.duration) setDuration(tpl.duration);
      if (tpl.media_type) setActiveMode(tpl.media_type);
      if (tpl.model_id && models.length > 0) {
        const found = models.find(m => m.id === tpl.model_id || m.fal_endpoint === tpl.model_id);
        if (found) setSelectedModel(found);
      }
      toast.success(`✨ Loaded template: "${tpl.title || 'Creative Preset'}"`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (location.state?.mode) {
      setActiveMode(location.state.mode);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (location.state?.remixMedia || location.state?.remixPrompt || location.state?.prompt) {
      hasLoadedRemixRef.current = true;
      const media = location.state.remixMedia || {};
      const prompt = media.prompt || location.state.remixPrompt || location.state.prompt || '';
      const title = location.state.title || (media.title ? `Remix: ${media.title}` : 'Remix Creation');
      const aspect = media.aspect_ratio || location.state.aspectRatio || '16:9';
      const dur = media.duration || location.state.duration || 6;
      const modelVal = location.state.model_id || location.state.model || media.model_id || media.model_name;
      const isImg = media.generation_type === 'image' || 
                    location.state.mediaType === 'image' || 
                    (media.video_url && /\.(jpg|jpeg|png|webp)($|\?)/i.test(media.video_url));
      const isSwap = media.generation_type === 'swap' || location.state.mediaType === 'swap';

      if (prompt) setPromptText(prompt);
      if (title) setProjectTitle(title);
      if (aspect) setAspectRatio(aspect);
      if (dur) setDuration(Number(dur) || 6);

      setActiveCanvasTab('editor');

      if (isImg) {
        setActiveMode('image');
        if (media.video_url) {
          setActiveImageUrl(media.video_url);
          setRemixImageUrl(media.video_url);
        }
        if (modelVal && models.length > 0) {
          const found = models.find(m => m.id === modelVal || m.fal_endpoint === modelVal || m.name === modelVal);
          if (found) setSelectedModel(found);
        }
        toast.success(`✨ "${title}" loaded for image remix!`, { icon: '🎨', duration: 3500 });
      } else if (isSwap) {
        setActiveMode('swap');
        if (media.video_url) {
          setActiveVideo(media);
          setSourceVideoUrl(media.video_url);
        }
        if (Array.isArray(media.characters) && media.characters.length > 0) {
          setSwapCharacters(media.characters);
          if (media.characters[0]?.target_image_url) {
            setImageUrl(media.characters[0].target_image_url);
          }
        } else if (media.input_image_url) {
          setImageUrl(media.input_image_url);
          setSwapCharacters([{ id: 'char-1', target_image_url: media.input_image_url, label: '' }]);
        }
        if (models.length > 0) {
          const videoModels = models.filter(m => (m.model_type || 'video') !== 'image');
          const found = videoModels.find(m => m.id === modelVal && ['kling-3-omni', 'seedance-2.5', 'seedance-2'].includes(m.id)) ||
                        videoModels.find(m => m.id === 'seedance-2.5') ||
                        videoModels.find(m => m.id === 'kling-3-omni') || 
                        videoModels.find(m => m.id === 'seedance-2') || 
                        videoModels[0];
          if (found) setSelectedModel(found);
        }
        toast.success(`✨ "${media.title || 'Reel'}" loaded in Character Swap! Upload character in Step 2.`, { icon: '🎭', duration: 4500 });
      } else {
        // Standard Text-to-Video / Image-to-Video Remix
        setActiveMode('video');
        if (media.video_url) {
          setActiveVideo(media);
        }
        if (media.input_image_url) {
          setImageUrl(media.input_image_url);
        }
        if (models.length > 0) {
          const videoModels = models.filter(m => (m.model_type || 'video') !== 'image');
          const found = videoModels.find(m => m.id === modelVal || m.fal_endpoint === modelVal || m.name === modelVal) || videoModels[0];
          if (found) setSelectedModel(found);
        }
        toast.success(`✨ "${media.title || 'Reel'}" loaded in Video Studio for remix!`, { icon: '🎬', duration: 3500 });
      }

      // Clear state only after models have had an opportunity to resolve
      if (models.length > 0) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    }
  }, [location.state, location.search, models]);
  
  // Lists
  const [recentVideos, setRecentVideos] = useState([]);
  const [queueVideos, setQueueVideos] = useState([]);
  const [historyVideos, setHistoryVideos] = useState([]);
  const [watermarkRequired, setWatermarkRequired] = useState(true);

  // Reset detected dimensions whenever media changes
  useEffect(() => {
    setMediaDimensions(null);
    setIsVideoMuted(false);
  }, [activeVideo?.id, activeVideo?.video_url, activeImageUrl, activeMode]);

  // Video element metadata handler (reads actual video file dimensions)
  const handleVideoMetadata = (e) => {
    const { videoWidth, videoHeight } = e.target;
    if (videoWidth && videoHeight) {
      setMediaDimensions({
        width: videoWidth,
        height: videoHeight,
        ratio: videoWidth / videoHeight
      });
    }
  };

  // Image element load handler (reads actual image file dimensions)
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setMediaDimensions({
        width: naturalWidth,
        height: naturalHeight,
        ratio: naturalWidth / naturalHeight
      });
    }
  };

  // Calculate dynamic aspect ratio & auto-fit container sizing for the Studio canvas
  const getCanvasAspectConfig = () => {
    // 1. Natural media dimensions detected from loaded video or image file
    if (mediaDimensions?.ratio) {
      const r = mediaDimensions.ratio;
      if (r < 0.75) {
        // Vertical Portrait (9:16 Shorts / Reels / TikTok)
        return {
          wrapperClass: 'w-auto max-w-[340px] aspect-[9/16] max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
          aspectRatio: '9/16',
          label: '9:16 Portrait'
        };
      } else if (r >= 0.75 && r <= 1.25) {
        // Square (1:1 Feed / Square)
        return {
          wrapperClass: 'w-full max-w-[430px] aspect-square max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
          aspectRatio: '1/1',
          label: '1:1 Square'
        };
      } else if (r > 1.25 && r <= 1.55) {
        // Standard (4:3)
        return {
          wrapperClass: 'w-full max-w-lg aspect-[4/3] max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
          aspectRatio: '4/3',
          label: '4:3 Standard'
        };
      } else {
        // Widescreen Landscape (16:9)
        return {
          wrapperClass: 'w-full max-w-xl aspect-video max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
          aspectRatio: '16/9',
          label: '16:9 Landscape'
        };
      }
    }

    // 2. Active video saved aspect ratio in DB
    const targetAspect = activeVideo?.aspect_ratio || aspectRatio;
    if (targetAspect === '9:16') {
      return {
        wrapperClass: 'w-auto max-w-[340px] aspect-[9/16] max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
        aspectRatio: '9/16',
        label: '9:16 Portrait'
      };
    } else if (targetAspect === '1:1') {
      return {
        wrapperClass: 'w-full max-w-[430px] aspect-square max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
        aspectRatio: '1/1',
        label: '1:1 Square'
      };
    } else if (targetAspect === '4:3') {
      return {
        wrapperClass: 'w-full max-w-lg aspect-[4/3] max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
        aspectRatio: '4/3',
        label: '4:3 Standard'
      };
    }

    // Default 16:9 Landscape
    return {
      wrapperClass: 'w-full max-w-xl aspect-video max-h-[26vh] xs:max-h-[30vh] sm:max-h-[42vh] lg:max-h-[58vh]',
      aspectRatio: '16/9',
      label: '16:9 Landscape'
    };
  };

  const canvasAspect = getCanvasAspectConfig();

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
      // Adjust duration limit to match the active model's true ceiling
      if (selectedModel.id === 'minimax-hailuo') {
        setDuration(6);
      } else {
        const modelMax = Number(selectedModel.max_duration) || 10;
        if (modelMax > 0 && duration > modelMax) {
          setDuration(modelMax);
        }
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

      // Auto-load most recent completed video in Editor if idle (and no remix reel is loaded)
      if (completed.length > 0 && !activeVideo && !hasLoadedRemixRef.current && generationStatus === 'idle') {
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
      if (activeMode === 'image') {
        const imageModels = models.filter(m => m.model_type === 'image');
        if (imageModels.length > 0 && (!selectedModel || selectedModel.model_type !== 'image')) {
          setSelectedModel(imageModels[0]);
        }
      } else if (activeMode === 'swap') {
        const videoModels = models.filter(m => (m.model_type || 'video') !== 'image');
        const swapModel = videoModels.find(m => m.id === 'kling-3-omni') || videoModels.find(m => m.id === 'seedance-2.5') || videoModels.find(m => m.id === 'seedance-2') || videoModels[0];
        if (!selectedModel || !['kling-3-omni', 'seedance-2.5', 'seedance-2'].includes(selectedModel.id)) {
          setSelectedModel(swapModel);
        }
      } else {
        // 'video'
        const videoModels = models.filter(m => (m.model_type || 'video') !== 'image');
        if (videoModels.length > 0) {
          if (!selectedModel || selectedModel.model_type === 'image') {
            setSelectedModel(videoModels[0]);
          }
        }
      }
    }
  }, [activeMode, models]);

  // Cost calculation
  const getEstimatedCost = () => {
    if (!selectedModel) return 0;
    if (selectedModel.model_type === 'image') {
      return parseFloat(selectedModel.base_cost || 8);
    }
    return duration * parseFloat(selectedModel.price_per_second || 2.5);
  };

  const cost = getEstimatedCost();
  const insufficientCredits = (profile?.credits || 0) < cost;

  // Poll processing jobs
  useEffect(() => {
    if (!activeGenerationId) return;

    setGenerationStatus('pending');
    setGenerationProgress(10);
    
    let isPolling = false;
    let failureCount = 0;

    let interval = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        const res = await getStatus(activeGenerationId);
        failureCount = 0; // Reset on success
        
        if (res.status === 'processing') {
          setGenerationStatus('processing');
          setGenerationProgress(p => Math.min(90, p + 5)); // Simulate incremental loading
        } else if (res.status === 'completed') {
          const currentId = res.id || activeGenerationId;
          setGenerationStatus('completed');
          setGenerationProgress(100);
          setActiveGenerationId(null);
          toast.success('AI Video compiled successfully!');
          await refreshProfile();
          await loadStudioData();
          
          // Load generated asset directly to video panel
          try {
            const completeDetails = await api.get(`/generate/${currentId}`);
            setActiveVideo(completeDetails.data);
          } catch (fetchErr) {
            console.warn('[Studio] Direct fetch fallback:', fetchErr);
            if (res.video_url) {
              setActiveVideo({ id: currentId, video_url: res.video_url, thumbnail_url: res.thumbnail_url });
            }
          }
          setGenerationStatus('idle');
        } else if (res.status === 'failed') {
          const failedId = res.id || activeGenerationId;
          setGenerationStatus('failed');
          setGenerationError(res.error_message || 'API request timeout.');
          setFailedGenId(failedId);
          setActiveGenerationId(null);
          toast.error('AI compilation failed. Cost refunded.');
          await refreshProfile();
          await loadStudioData();
        }
      } catch (err) {
        console.error('Polling check failed:', err);
        failureCount++;
        // If generation record does not exist (404) or fails 5 consecutive times, gracefully terminate polling
        if (err.response?.status === 404 || failureCount >= 5) {
          console.warn('[Studio] Terminating polling loop for:', activeGenerationId);
          setActiveGenerationId(null);
          setGenerationStatus('idle');
        }
      } finally {
        isPolling = false;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGenerationId]);

  // Dismiss failed error and immediately purge failed attempt from database
  const handleDismissError = async () => {
    if (failedGenId) {
      const idToDelete = failedGenId;
      setFailedGenId(null);
      try {
        await deleteGeneration(idToDelete);
      } catch (err) {
        console.warn('[Studio] Auto-removal of failed generation from DB:', err);
      }
    }
    setGenerationStatus('idle');
    setGenerationError('');
  };

  const [cancelling, setCancelling] = useState(false);

  // Cancellation action handler with backend sync & credit refund
  const handleCancelGeneration = async (targetId = null) => {
    const idToCancel = targetId || activeGenerationId;
    if (!idToCancel) {
      setGenerationStatus('idle');
      return;
    }
    setCancelling(true);
    try {
      await cancelGeneration(idToCancel);
      toast.success('Generation cancelled. Credits refunded.');
      if (activeGenerationId === idToCancel || !targetId) {
        setActiveGenerationId(null);
        setGenerationStatus('idle');
        setGenerationProgress(0);
      }
      await refreshProfile();
      await loadStudioData();
    } catch (err) {
      console.error('[Studio] Cancel generation error:', err);
      toast.error(err.message || 'Could not cancel generation.');
      if (err.message?.toLowerCase().includes('not found') || err.message?.toLowerCase().includes('already')) {
        if (activeGenerationId === idToCancel || !targetId) {
          setActiveGenerationId(null);
          setGenerationStatus('idle');
        }
        refreshProfile();
      }
    } finally {
      setCancelling(false);
    }
  };

  // Auto-clean failed generation attempt from DB after showing for a while (90s)
  useEffect(() => {
    if (generationStatus === 'failed' && failedGenId) {
      const timer = setTimeout(() => {
        handleDismissError();
      }, 90000);
      return () => clearTimeout(timer);
    }
  }, [generationStatus, failedGenId]);

  // Prompt Templates Categories
  const promptTemplates = [
    { label: '🎬 Cinematic', text: 'Cinematic tracking shot of a futuristic cyberpunk cityscape at night, neon reflections in puddles, atmospheric fog, detailed architecture, photorealistic 8k.' },
    { label: '🎭 Char Swap', text: 'Seamlessly replace the subject with an elegant cyberpunk hero wearing matte black techwear, perfect motion transfer, dynamic lighting, 8k render.' },
    { label: '🌿 Nature', text: 'Epic slow motion drone sweep across lush tropical waterfalls cascading into crystal lagoons, hyperrealistic moss, golden hour lighting.' },
    { label: '🚗 Product', text: 'Dynamic studio zoom on a sleek metallic sports car, smoke effects, high contrast studio lights flashing, slow dramatic pan, 4k.' },
    { label: '🎨 Abstract', text: 'Vibrant fluid simulation of glowing colorful paints swirling inside zero-gravity, cosmic stardust particle elements, slow morph.' }
  ];

  // Commercial Ad Creative Styles for AI Enhancer
  const adCreativeStyles = [
    { id: 'ad-commercial', label: '✨ Brand Commercial' },
    { id: 'viral-reels', label: '📱 Viral TikTok / Reel' },
    { id: 'cinematic', label: '🎬 Hollywood Cinema' },
    { id: 'product-showcase', label: '🛍️ 3D Kinetic Product' }
  ];

  const handleEnhancePrompt = async () => {
    if (!promptText.trim()) {
      toast.error('Type a brief prompt idea first to enhance it into a commercial ad.');
      return;
    }
    setIsEnhancing(true);
    const toastId = toast.loading('Engineering cinematic commercial prompt...');
    try {
      const res = await api.post('/generate/enhance-prompt', {
        prompt: promptText,
        style: adStyle,
        mode: activeMode
      });
      if (res.data?.enhancedPrompt) {
        setPromptText(res.data.enhancedPrompt);
        toast.success('🪄 Prompt enhanced for high-converting cinematic ad!', { id: toastId });
      }
    } catch (err) {
      toast.error('Prompt enhancement failed. Try again.', { id: toastId });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Dispatch Generation job
  const handleGenerate = async () => {
    if (failedGenId) {
      deleteGeneration(failedGenId).catch(() => {});
      setFailedGenId(null);
    }
    if (!selectedModel) {
      toast.error('No AI Model selected.');
      return;
    }

    if (activeMode !== 'swap' && !promptText.trim()) {
      toast.error('Prompt description is empty.');
      return;
    }

    if (activeMode === 'video' && imageUrl && selectedModel?.supports_image_input === false && !selectedModel.id.includes('seedance') && !selectedModel.id.includes('kling') && !selectedModel.id.includes('minimax')) {
      toast.error('The selected model does not support image input. Remove the image or switch to an image-compatible model.');
      return;
    }

    if (insufficientCredits) {
      toast.error(`Insufficient balance. This model costs ₹${cost.toFixed(2)}, but your current balance is ₹${(profile?.credits || 0).toFixed(2)}.`);
      return;
    }

    // SWAP MODE — Character Replacement / Video-to-Video Motion Transfer
    if (activeMode === 'swap') {
      if (!sourceVideoUrl) {
        toast.error('Source motion video is required for character replacement.');
        return;
      }

      const validCharacters = swapCharacters.filter(c => c.target_image_url && c.target_image_url.trim());
      const primaryChar = validCharacters[0]?.target_image_url || imageUrl || null;

      if (!primaryChar && !promptText.trim()) {
        toast.error('Please provide at least one target character photo or character description prompt.');
        return;
      }

      try {
        setGenerationStatus('pending');
        setGenerationError('');
        setActiveCanvasTab('editor');

        const payload = {
          source_video_url: sourceVideoUrl,
          target_character_url: primaryChar,
          characters: validCharacters.length > 0 ? validCharacters : (primaryChar ? [{ id: 'char-1', target_image_url: primaryChar, label: '' }] : []),
          prompt: promptText,
          model_id: selectedModel.id,
          duration: duration,
          aspect_ratio: aspectRatio
        };

        const res = await createSwapGeneration(payload);
        refreshProfile();

        if (res.success && res.generationId) {
          setActiveGenerationId(res.generationId);
          toast.loading(
            validCharacters.length > 1
              ? `Initiating Multi-Character (${validCharacters.length}) replacement pipeline...`
              : 'Initiating Character Replacement pipeline...',
            { id: 'gen-dispatch' }
          );
          setTimeout(() => toast.dismiss('gen-dispatch'), 2000);
        }
      } catch (err) {
        setGenerationStatus('idle');
        refreshProfile();
        toast.error(err.message || 'Character swap failed to submit.');
      }
      return;
    }

    // IMAGE MODE — call synchronous image endpoint with optional I2I remix
    if (activeMode === 'image') {
      try {
        setImageGenerating(true);
        setActiveImageUrl(null);
        refreshProfile(); // Sync balance right after trigger
        const res = await createImageGeneration({
          prompt: promptText,
          model_id: selectedModel.id,
          aspect_ratio: aspectRatio,
          input_image: remixImageUrl || null
        });
        if (res.success && res.image_url) {
          setActiveImageUrl(res.image_url);
          toast.success(remixImageUrl ? 'Image remixed successfully!' : 'Image generated!');
        }
      } catch (err) {
        toast.error(err.message || 'Image generation failed.');
      } finally {
        setImageGenerating(false);
        await refreshProfile();
      }
      return;
    }

    // VIDEO MODE (Text-to-Video & Image-to-Video)
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
        generate_audio: generateAudio && (selectedModel?.supports_audio !== false),
        image_url: imageUrl || null
      };

      const res = await createGeneration(payload);
      refreshProfile(); // Sync balance right after dispatch
      
      if (res.success && res.generationId) {
        setActiveGenerationId(res.generationId);
        toast.loading('Initiating server GPU dispatch...', { id: 'gen-dispatch' });
        setTimeout(() => toast.dismiss('gen-dispatch'), 2000);
      }
    } catch (err) {
      setGenerationStatus('idle');
      refreshProfile();
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
  }, [promptText, selectedModel, duration, resolution, aspectRatio, imageUrl, insufficientCredits]);

  const renderControlPanelContent = (isMobile = false) => (
    <div className="space-y-4">
      {/* 1. HIGGSFIELD UNIFIED MEDIA DROPZONE */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
          <span>Media Input</span>
          <span className="text-[9px] text-white/30 font-normal">Auto-detects 9:16</span>
        </label>
        <UnifiedMediaUploader
          assets={mediaAssets}
          onChange={handleMediaAssetsChange}
          onOrientationDetected={(detectedAspect) => {
            setAspectRatio(detectedAspect);
            toast.success(`Orientation detected: ${detectedAspect}`, { icon: '📐', duration: 1500 });
          }}
          onDurationDetected={(detectedDur) => {
            const rawDur = Math.round(detectedDur);
            const modelMax = Number(selectedModel?.max_duration) || 10;
            const clamped = Math.max(3, Math.min(modelMax, rawDur));
            setDuration(clamped);
            if (rawDur > modelMax) {
              toast(`Video is ${rawDur}s: trimmed to ${modelMax}s (${selectedModel?.name || 'AI'} tensor limit)`, { icon: '⏱️', duration: 3500 });
            } else {
              toast(`Detected video length: ${clamped}s`, { icon: '⏱️', duration: 2000 });
            }
          }}
        />
      </div>

      {/* 2. HIGGSFIELD PROMPT BOX WITH @ ELEMENTS & AUDIO */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
            Prompt & Scene Direction
          </label>
          <button
            type="button"
            disabled={isEnhancing || !promptText.trim()}
            onClick={handleEnhancePrompt}
            className="text-[9.5px] font-bold text-yellow-400/90 hover:text-yellow-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Enhance prompt with AI"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
          </button>
        </div>

        <div className="bg-[#121316] border border-white/12 focus-within:border-yellow-400/60 rounded-2xl p-3 transition-all space-y-2.5 shadow-inner">
          <textarea
            ref={promptRef}
            placeholder="Describe your scene in detail. Use @ to reference assets (e.g. Replace character in @Video1 with @Image1)..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            className="w-full bg-transparent text-xs text-white placeholder-white/25 resize-none focus:outline-none leading-relaxed"
          />

          {/* Bottom Row Inside Prompt Box */}
          <div className="flex items-center justify-between pt-1 border-t border-white/6 text-xs">
            {/* @ Elements Button */}
            <button
              type="button"
              onClick={() => {
                if (mediaAssets.length === 0) {
                  toast('Upload an image or video above to tag @Elements', { icon: '💡' });
                  return;
                }
                const tags = mediaAssets.map(a => a.tag).join(' and ');
                if (!promptText.includes(mediaAssets[0].tag)) {
                  setPromptText(prev => prev ? `${prev} using ${tags}` : `Replace character in ${tags}`);
                } else {
                  toast(`Elements ${tags} already tagged in prompt`, { icon: '✓' });
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium transition-colors cursor-pointer border border-white/5"
            >
              <span className="text-yellow-400 font-bold font-mono">@</span>
              <span>Elements</span>
            </button>

            {/* Audio Toggle Pill */}
            <button
              type="button"
              onClick={() => setGenerateAudio(!generateAudio)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                generateAudio
                  ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300'
                  : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {generateAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODEL SELECTOR */}
      <div className="space-y-1.5 relative" ref={modelPickerRef}>
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">AI Model</label>
        <button
          type="button"
          onClick={() => setModelPickerOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-[#121316] hover:bg-[#16171b] border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-yellow-400/10 text-yellow-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-xs font-bold text-white truncate block">
                {selectedModel?.name || 'Kling 3.0 Omni Director'}
              </span>
              {selectedModel && (
                <span className="text-[9px] text-white/40 font-bold block uppercase tracking-wider">
                  {selectedModel.model_type === 'image'
                    ? 'Flat cost'
                    : `${selectedModel.supported_resolutions?.slice(-1)[0]?.toUpperCase() || '720P'} · ${Number(selectedModel.max_duration) || 10}s max`
                  }
                </span>
              )}
            </div>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-white/40 transition-transform ${modelPickerOpen ? 'rotate-90' : ''}`} />
        </button>

        {/* Dropdown list */}
        {modelPickerOpen && (
          <div className="absolute left-0 right-0 z-50 top-full mt-1 bg-[#16171c] border border-white/12 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
            {models.map(model => (
              <button
                key={model.id}
                type="button"
                onClick={() => { setSelectedModel(model); setModelPickerOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  selectedModel?.id === model.id ? 'bg-yellow-400/10 text-yellow-300 font-bold' : 'hover:bg-white/5 text-white/80'
                }`}
              >
                <div className="truncate">
                  <p className="truncate font-medium">{model.name}</p>
                  <p className="text-[9px] text-white/40 uppercase">
                    {model.model_type === 'image'
                      ? 'Image Model'
                      : `${model.supported_resolutions?.slice(-1)[0] || '720P'} · ${Number(model.max_duration) || 10}s max`
                    }
                  </p>
                </div>
                {selectedModel?.id === model.id && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. 3 AUTO PILLS (Duration • Aspect Ratio • Resolution) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">Output Format</label>
        <div className="grid grid-cols-3 gap-1.5">
          {/* Duration Pill */}
          <button
            type="button"
            onClick={() => {
              const maxAllowed = Number(selectedModel?.max_duration) || 10;
              if (selectedModel?.id === 'minimax-hailuo') {
                toast('MiniMax Hailuo generates fixed 6s video clips', { icon: 'ℹ️' });
                return;
              }
              let options = [5, 10];
              if (maxAllowed <= 5) options = [5];
              else if (maxAllowed <= 6) options = [6];
              else if (maxAllowed >= 15) options = [5, 10, 15];

              const currentIdx = options.indexOf(duration);
              const next = options[(currentIdx + 1) % options.length] || options[0];
              setDuration(next);
              toast(`Duration set to ${next}s`, { icon: '⏱️', duration: 1200 });
            }}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#121316] border border-white/10 hover:border-white/20 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
            title={`Click to cycle duration (${selectedModel?.name || 'Model'}: max ${Number(selectedModel?.max_duration) || 10}s)`}
          >
            <Clock className="w-3 h-3 text-white/40" />
            <span>{duration}s</span>
          </button>

          {/* Aspect Ratio Pill */}
          <button
            type="button"
            onClick={() => {
              const next = aspectRatio === '9:16' ? '16:9' : '9:16';
              setAspectRatio(next);
              toast.success(`Aspect ratio: ${next}`, { icon: '📐', duration: 1200 });
            }}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#121316] border border-white/10 hover:border-white/20 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
            title="Click to toggle 9:16 vertical (Reels) vs 16:9 landscape"
          >
            <span className="text-[10px] text-white/40">▯</span>
            <span>{aspectRatio}</span>
          </button>

          {/* Resolution Pill */}
          <button
            type="button"
            onClick={() => {
              const next = resolution === '720p' ? '1080p' : '720p';
              setResolution(next);
            }}
            className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#121316] border border-white/10 hover:border-white/20 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
            title="Click to toggle 720p / 1080p"
          >
            <span className="text-[10px] text-white/40">👁️</span>
            <span>{resolution.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* 5. COST & BALANCE */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121316] rounded-xl border border-white/6 text-xs">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Estimated Cost</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-white/90">₹{cost.toFixed(1)}</span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] text-white/50">Bal: ₹{(profile?.credits || 0).toFixed(1)}</span>
        </div>
      </div>

      {/* 6. NEON GENERATE CTA BUTTON */}
      <button
        type="button"
        disabled={
          (generationStatus !== 'idle' && generationStatus !== 'completed' && generationStatus !== 'failed') ||
          imageGenerating ||
          insufficientCredits
        }
        onClick={handleGenerate}
        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
          insufficientCredits
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
            : (generationStatus === 'pending' || generationStatus === 'processing' || imageGenerating)
            ? 'bg-yellow-400/40 text-black cursor-wait'
            : 'bg-[#E8FF3B] text-black hover:bg-[#d6f028] shadow-[#E8FF3B]/20 hover:shadow-[#E8FF3B]/30'
        }`}
      >
        {(generationStatus === 'pending' || generationStatus === 'processing' || imageGenerating) ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : insufficientCredits ? (
          <span>Insufficient Balance (₹{(profile?.credits || 0).toFixed(0)})</span>
        ) : (
          <>
            <span>Generate</span>
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span className="bg-black/15 px-2 py-0.5 rounded-full text-[10px] font-black">₹{cost.toFixed(0)}</span>
          </>
        )}
      </button>

      {isMobile && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-2 py-2 font-bold uppercase text-[10px] tracking-wider"
          onClick={() => setMobileControlsOpen(false)}
        >
          View Video Canvas
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-grow h-full w-full overflow-hidden bg-darkBg text-white relative">
      
      {/* MOBILE CONTROL DRAWER (Slide-up native bottom sheet for < lg screens) */}
      {mobileControlsOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-45 bg-black/80 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileControlsOpen(false)}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 max-h-[88dvh] bg-[#141416] border-t border-white/10 rounded-t-3xl p-5 pb-24 overflow-y-auto z-50 shadow-2xl flex flex-col space-y-4 animate-fade-in">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-white/5 sticky top-0 bg-[#141416] z-10">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Studio Configuration</h3>
              </div>
              <button
                onClick={() => setMobileControlsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderControlPanelContent(true)}
          </div>
        </>
      )}

      {/* PANEL 2: DESKTOP LEFT CONTROL PANEL (320px wide - Higgsfield Style) */}
      <aside className="hidden lg:flex flex-col w-[320px] bg-[#0c0d10] border-r border-white/8 p-3.5 overflow-y-auto shrink-0 select-none space-y-4 relative scrollbar-thin">
        {renderControlPanelContent(false)}
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
            <div className="flex items-center space-x-2">
              {(generationStatus === 'pending' || generationStatus === 'processing') && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => handleCancelGeneration()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  title="Cancel this generation and refund credits"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel'}</span>
                </button>
              )}
              <Button
                variant="purple"
                size="md"
                disabled={
                  (activeMode === 'swap' 
                    ? (!sourceVideoUrl || (!imageUrl && !swapCharacters.some(c => Boolean(c.target_image_url?.trim())) && !promptText.trim()))
                    : !promptText.trim()
                  ) ||
                  insufficientCredits ||
                  (activeMode === 'image' ? imageGenerating : generationStatus !== 'idle')
                }
                onClick={handleGenerate}
                className="shadow-premium uppercase font-extrabold text-xs tracking-wider cursor-pointer"
              >
                {activeMode === 'swap'
                  ? (generationStatus !== 'idle' ? 'Composing Ingredients...' : 'Compose Video')
                  : activeMode === 'image'
                  ? (imageGenerating ? 'Generating Image...' : (remixImageUrl ? 'Remix Image' : 'Generate Image'))
                  : (generationStatus !== 'idle' ? 'Generating Video...' : 'Generate Video')
                }
              </Button>
            </div>
          }
        />

        {/* Mobile Quick Mode Selector & Settings Ribbon (< lg screens only) */}
        <div className="lg:hidden px-3 pt-2 shrink-0">
          <div className="flex items-center justify-between gap-2 bg-[#0A0B11]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 text-xs select-none shadow-card">
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 text-[10px] font-extrabold uppercase tracking-wider flex-1">
              {[
                { id: 'swap', label: 'Character Swap', icon: Users },
                { id: 'video', label: 'AI Video', icon: Film },
                { id: 'image', label: 'AI Image', icon: Sparkles }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveMode(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                    activeMode === id ? 'bg-gradient-purple text-white shadow-glow font-extrabold' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMobileControlsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/90 rounded-xl text-xs font-bold transition-all border border-white/10 shrink-0 cursor-pointer"
              title="Open studio settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-black">{aspectRatio}</span>
            </button>
          </div>
        </div>

        {/* Middle Canvas workspace area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 sm:px-6 sm:py-4 flex flex-col items-center justify-center">
          {/* Active Canvas Tabs Panels */}
          <div className="w-full flex items-center justify-center">
            {activeCanvasTab === 'editor' && (
              <div className={`transition-all duration-300 ease-out glass-premium rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden relative shadow-premium ${canvasAspect.wrapperClass}`}>
                
                {/* IMAGE MODE CANVAS */}
                {activeMode === 'image' ? (
                  imageGenerating ? (
                    <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-primary-hover animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {remixImageUrl ? 'Remixing Image with AI Reference' : 'Generating High-Detail Image'}
                        </h4>
                        <p className="text-[10.5px] text-white/45 mt-1 font-semibold uppercase tracking-wider">
                          Running {selectedModel?.name} on Replicate GPU...
                        </p>
                      </div>
                    </div>
                  ) : activeImageUrl ? (
                    <div className="relative w-full h-full group flex items-center justify-center bg-black/95">
                      <img
                        src={activeImageUrl}
                        alt="Generated result"
                        onLoad={handleImageLoad}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md border border-white/10 text-[9.5px] font-bold text-white/80 z-20 pointer-events-none flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>{canvasAspect.label}</span>
                        {mediaDimensions && (
                          <span className="text-white/40">({mediaDimensions.width}×{mediaDimensions.height})</span>
                        )}
                      </div>
                      <a
                        href={activeImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm border border-white/15 rounded-lg text-xs font-bold text-white transition-colors z-20"
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
                        Describe your vision below {remixImageUrl ? 'to remix with your uploaded reference' : `and select an image model (${selectedModel?.name || 'Nano Banana 2.0'}) to create artwork`}.
                      </p>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                        Target Framing: {canvasAspect.label}
                      </div>
                    </div>
                  )
                ) : (
                  /* VIDEO & SWAP MODE CANVAS */
                  generationStatus === 'pending' || generationStatus === 'processing' ? (
                    /* Processing compilation frame */
                    <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-primary-hover animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {activeMode === 'swap' ? 'Composing Ingredients Motion Video' : 'Compiling Cinematic Frames'}
                        </h4>
                        <p className="text-[10.5px] text-white/45 mt-1 font-semibold uppercase tracking-wider">
                          {activeMode === 'swap' 
                            ? `Synthesizing motion & ingredients with ${selectedModel?.name || 'Kling 3.0 Omni'}...`
                            : `Running ${selectedModel?.name} pipeline in background...`
                          }
                        </p>
                      </div>
                      <div className="w-64 space-y-3">
                        <ProgressBar value={generationProgress} showGlow />
                        <div className="flex items-center justify-center pt-1">
                          <button
                            type="button"
                            disabled={cancelling}
                            onClick={() => handleCancelGeneration()}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancelling ? 'Cancelling...' : 'Cancel Generation'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : generationStatus === 'failed' ? (
                    /* Generation Failure frame */
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <X className="w-10 h-10 text-error p-2 bg-error/15 rounded-full border border-error/25 animate-bounce" />
                      <h4 className="text-sm font-extrabold text-error">AI Synthesis Disrupted</h4>
                      <p className="text-xs text-white/50 max-w-sm leading-relaxed">{generationError}</p>
                      <Button variant="secondary" size="sm" onClick={handleDismissError}>
                        Try Again
                      </Button>
                    </div>
                  ) : activeVideo ? (
                    /* Active video playing VLC Frame */
                    <div className="relative w-full h-full group flex items-center justify-center bg-black/95">
                      <video
                        ref={videoPlayerRef}
                        src={activeVideo.video_url}
                        controls
                        autoPlay
                        playsInline
                        loop
                        onLoadedMetadata={handleVideoMetadata}
                        className="w-full h-full object-contain"
                      />

                      {/* Dynamic Format/Resolution Badge */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md border border-white/10 text-[9.5px] font-bold text-white/80 z-20 pointer-events-none flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>{canvasAspect.label}</span>
                        {mediaDimensions && (
                          <span className="text-white/40">({mediaDimensions.width}×{mediaDimensions.height})</span>
                        )}
                      </div>

                      {/* Quick Audio Mute / Unmute Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (videoPlayerRef.current) {
                            videoPlayerRef.current.muted = !videoPlayerRef.current.muted;
                            setIsVideoMuted(videoPlayerRef.current.muted);
                          }
                        }}
                        className="absolute bottom-3 left-3 p-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors z-20 cursor-pointer"
                        title={isVideoMuted ? "Unmute Audio" : "Mute Audio"}
                      >
                        {isVideoMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-primary" />}
                      </button>

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
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                        Target Framing: {canvasAspect.label}
                      </div>
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
                          <button
                            type="button"
                            disabled={cancelling}
                            onClick={() => handleCancelGeneration(video.id)}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Cancel this generation and refund credits"
                          >
                            Cancel
                          </button>
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
        </div>

        {/* Prompt input tray & Fixed Thumb Dock (Pinned at bottom on mobile, hidden on desktop where sidebar contains Higgsfield controls) */}
        <div className="lg:hidden shrink-0 w-full px-2 pb-2 sm:px-6 sm:pb-4 max-w-2xl mx-auto z-20">
          <div className="w-full bg-surface border border-white/8 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl select-none shadow-premium space-y-2 sm:space-y-3">
            
            {/* DESKTOP TOOLBARS (visible on sm: and above) */}
            <div className="hidden sm:block space-y-2.5">
              {/* Quick Templates & Ad Styles Toolbar */}
              <div className="flex flex-row items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div className="flex items-center space-x-1.5 overflow-x-auto pr-1 scrollbar-none">
                  <span className="text-[9px] font-black uppercase text-primary-hover tracking-wider shrink-0 mr-1 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Ad Style:
                  </span>
                  {adCreativeStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setAdStyle(style.id)}
                      className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all shrink-0 cursor-pointer border ${
                        adStyle === style.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white/5 text-white/60 hover:text-white border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                {/* Enhance Button */}
                <button
                  type="button"
                  disabled={isEnhancing || !promptText.trim()}
                  onClick={handleEnhancePrompt}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 text-white rounded-lg text-[10.5px] font-extrabold transition-all shadow-glow shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Transform your idea into a high-converting commercial ad prompt like ChatGPT"
                >
                  {isEnhancing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  )}
                  <span>{isEnhancing ? 'Enhancing...' : '🪄 Enhance for Ads'}</span>
                </button>
              </div>

              {/* Higgsfield Camera Motion Ribbon */}
              {(activeMode === 'video' || activeMode === 'swap') && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 text-[9.5px]">
                  <span className="font-black uppercase text-primary tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
                    <Camera className="w-3 h-3 text-primary" />
                    Camera:
                  </span>
                  {cameraPresets.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => handleToggleCamera(cam)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 text-xs min-h-[32px] ${
                        selectedCamera === cam.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10'
                      }`}
                      title={cam.text}
                    >
                      <span>{cam.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE 1-ROW CONSOLIDATED CREATIVE TOOL RIBBON (< sm screens) */}
            <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[9.5px] border-b border-white/5">
              {/* Compact Enhance Pill */}
              <button
                type="button"
                disabled={isEnhancing || !promptText.trim()}
                onClick={handleEnhancePrompt}
                className="flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 active:scale-95 text-white rounded-lg text-[10px] font-extrabold transition-all shadow-glow shrink-0 cursor-pointer disabled:opacity-40"
                title="Enhance prompt for ads"
              >
                {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-300" />}
                <span>{isEnhancing ? 'Enhancing...' : '🪄 Enhance'}</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />

              {/* Ad Styles Chips */}
              {adCreativeStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setAdStyle(style.id)}
                  className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition-all shrink-0 cursor-pointer border ${
                    adStyle === style.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/5'
                  }`}
                >
                  {style.label}
                </button>
              ))}

              {/* Camera Presets (if video/swap) */}
              {(activeMode === 'video' || activeMode === 'swap') && (
                <>
                  <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
                  {cameraPresets.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => handleToggleCamera(cam)}
                      className={`px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 text-[9.5px] ${
                        selectedCamera === cam.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                      }`}
                      title={cam.text}
                    >
                      <span>{cam.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                ref={promptRef}
                placeholder={
                  activeMode === 'swap'
                    ? "Describe scene direction, lighting, or action (e.g. 'Hero in red jacket walking in vibrant street') — or leave empty for direct motion transfer..."
                    : activeMode === 'image'
                    ? "Describe your visual ad idea in rich detail (e.g. Luxury perfume bottle on marble, soft lighting)..."
                    : "Describe your cinematic scene — subject, actions, camera shifts, and moody lighting..."
                }
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                maxLength="1500"
                rows="2"
                className="w-full bg-surface-elevated text-xs sm:text-sm rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-white/10 focus:outline-none focus:border-primary text-white resize-none placeholder-white/20 min-h-[46px] sm:min-h-[58px]"
              />
              <span className="absolute bottom-1.5 right-2.5 text-[9.5px] font-bold text-white/25 pointer-events-none">
                {promptText.length}/1500
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold tracking-wider">
              <span className="truncate mr-2 flex items-center gap-1.5 text-emerald-400/90 font-bold uppercase text-[9.5px]">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Universal Prompt Shield Active</span>
              </span>
              <span className="hidden sm:inline shrink-0 uppercase text-[9.5px] text-white/30">Ctrl+Enter to compile</span>
            </div>

            {/* MOBILE DOCKED THUMB ACTION BAR (< lg screens only) */}
            <div className="lg:hidden pt-2 border-t border-white/8 flex flex-col gap-2">
              {/* Quick thumb controls row: Aspect Ratio + Media Status + Settings */}
              <div className="flex items-center justify-between gap-1.5 text-xs">
                {/* 1-Tap Aspect Ratio toggle: 9:16 vertical <-> 16:9 landscape */}
                <button
                  type="button"
                  onClick={() => {
                    const nextAspect = aspectRatio === '9:16' ? '16:9' : '9:16';
                    setAspectRatio(nextAspect);
                    toast.success(`Switched to ${nextAspect === '9:16' ? 'Vertical Reel (9:16)' : 'Landscape (16:9)'}`, { icon: '📐', duration: 1500 });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl text-white font-bold text-xs shrink-0 transition-all cursor-pointer min-h-[38px]"
                  title="Toggle Aspect Ratio (9:16 Reel vs 16:9 Cinema)"
                >
                  <span className="text-primary font-black">{aspectRatio}</span>
                  <span className="text-white/60 text-[10px]">{aspectRatio === '9:16' ? 'Reel' : 'Cinema'}</span>
                </button>

                {/* Quick Media Trigger pill */}
                <button
                  type="button"
                  onClick={() => setMobileControlsOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 truncate justify-center min-h-[38px] ${
                    activeMode === 'swap'
                      ? (sourceVideoUrl
                          ? 'bg-primary/15 text-primary-hover border-primary/30'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10')
                      : (imageUrl
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10')
                  }`}
                >
                  {activeMode === 'swap' ? (
                    <>
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {sourceVideoUrl ? '✓ Video Ready' : '+ Upload Video'}
                      </span>
                    </>
                  ) : activeMode === 'image' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedModel?.name || 'Image Engine'}</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{imageUrl ? '✓ Image Attached' : '+ Add Image Ref'}</span>
                    </>
                  )}
                </button>

                {/* Full studio settings trigger button */}
                <button
                  type="button"
                  onClick={() => setMobileControlsOpen(true)}
                  className="flex items-center justify-center w-10 h-[38px] bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Studio Model & Settings"
                >
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                </button>
              </div>

              {/* Primary Mobile Action Buttons Row (Direct Thumb Reach!) */}
              <div className="flex items-center gap-2">
                {(generationStatus === 'pending' || generationStatus === 'processing') && (
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => handleCancelGeneration()}
                    className="flex items-center justify-center gap-1 px-3.5 py-2.5 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[44px]"
                    title="Cancel and refund"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}

                <Button
                  variant="purple"
                  size="lg"
                  disabled={
                    (activeMode === 'swap'
                      ? (!sourceVideoUrl || (!imageUrl && !swapCharacters.some(c => Boolean(c.target_image_url?.trim())) && !promptText.trim()))
                      : !promptText.trim()
                    ) ||
                    insufficientCredits ||
                    generationStatus === 'pending' ||
                    generationStatus === 'processing' ||
                    imageGenerating
                  }
                  onClick={handleGenerate}
                  className="flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all min-h-[48px]"
                >
                  {generationStatus === 'pending' || generationStatus === 'processing' || imageGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>{activeMode === 'swap' ? 'Recast Video' : activeMode === 'image' ? 'Generate Image' : 'Compose Video'}</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold text-white/90">
                        {formatCredits(cost)}
                      </span>
                    </>
                  )}
                </Button>
              </div>
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
