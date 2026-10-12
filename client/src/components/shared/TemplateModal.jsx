// client/src/components/shared/TemplateModal.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function TemplateModal({ template, onClose }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  if (!template) return null;

  const handleCreateNow = () => {
    navigate('/studio', {
      state: {
        template: {
          title: template.title,
          prompt: template.prompt,
          model_id: template.model_id,
          media_type: template.media_type,
          aspect_ratio: template.aspect_ratio || '9:16',
          duration: template.duration || 8
        }
      }
    });
    onClose();
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const cost = template.cost || (template.duration ? Math.round(template.duration * 3.5) : 30);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-fade-in select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 z-20 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer"
          aria-label="Back to feed"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-extrabold text-white tracking-wide truncate max-w-[200px] text-center font-['Outfit']">
          {template.title}
        </h3>

        <div className="flex items-center space-x-1.5 px-3 py-1 bg-purple-950/60 rounded-full border border-purple-500/30">
          <span className="text-xs">🪙</span>
          <span className="text-xs font-black text-purple-300">
            {profile?.credits || 0}
          </span>
        </div>
      </div>

      {/* Center 9:16 Looping Video Player Area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden relative">
        <div className="relative h-full max-h-[72vh] aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          {template.preview_video_url ? (
            <video
              ref={videoRef}
              src={template.preview_video_url}
              poster={template.preview_image_url}
              autoPlay
              loop
              muted={muted}
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={template.preview_image_url}
              alt={template.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Sound Toggle Button */}
          {template.preview_video_url && (
            <button
              onClick={toggleSound}
              className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Badge Overlay */}
          {template.badge && (
            <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/15 text-[10px] font-bold text-white tracking-wider">
              {template.badge}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Action Area */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent shrink-0 z-20 max-w-lg mx-auto w-full">
        <button
          onClick={handleCreateNow}
          className="w-full h-13 rounded-full bg-gradient-purple hover:opacity-95 active:scale-98 transition-all flex items-center justify-between px-6 text-white font-bold text-sm shadow-xl glow-purple cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-200" />
            Create Now
          </span>
          <span className="px-3 py-1 bg-black/25 rounded-full text-xs font-black tracking-wide text-purple-100 border border-white/10">
            🪙 {cost}
          </span>
        </button>

        <p className="text-[10px] text-white/40 text-center mt-2.5 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-purple-400" />
          Prohibit AI from generating illegal content. <span className="underline cursor-pointer">AI Safety Policy</span>
        </p>
      </div>
    </div>
  );
}
