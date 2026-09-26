// client/src/components/shared/MediaModal.jsx
import React, { useEffect } from 'react';
import { X, Download, Copy, Sparkles, Crown, Film, Image as ImageIcon } from 'lucide-react';
import { formatDate, formatCredits } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export default function MediaModal({
  isOpen,
  onClose,
  media,
  watermarkRequired = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  const isImage = media.generation_type === 'image' || (media.video_url && /\.(jpg|jpeg|png|webp)($|\?)/i.test(media.video_url));

  const handleDownload = async () => {
    if (watermarkRequired) {
      toast.error('⚠️ Download is reserved for paid users. Top up credits to unlock direct downloads.', {
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading('Starting download...');
    try {
      const response = await fetch(media.video_url);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = isImage ? 'png' : 'mp4';
      a.download = `brandvox-${(media.title || 'creation').replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download finished!', { id: toastId });
    } catch (err) {
      toast.error('Failed to download media file.', { id: toastId });
    }
  };

  const handleCopyPrompt = () => {
    if (!media.prompt) return;
    navigator.clipboard.writeText(media.prompt);
    toast.success('Prompt copied to clipboard!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface/50">
          <div className="flex items-center space-x-3 truncate mr-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary-hover">
              {isImage ? <ImageIcon className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-extrabold text-white truncate tracking-wide">
                {media.title || 'Untitled Creation'}
              </h3>
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                {formatDate(media.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-premium"
              title="Download asset"
            >
              {watermarkRequired ? <Crown className="w-3.5 h-3.5 text-warning" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Box */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[58vh]">
          {isImage ? (
            <img
              src={media.video_url}
              alt={media.title || 'AI Generated Art'}
              className="max-h-[58vh] w-auto max-w-full object-contain select-none"
            />
          ) : (
            <video
              src={media.video_url}
              controls
              autoPlay
              playsInline
              loop
              className="max-h-[58vh] w-auto max-w-full object-contain bg-black"
            />
          )}

          {watermarkRequired && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded border border-white/10 text-[9px] font-black uppercase text-primary select-none tracking-widest pointer-events-none">
              BrandVox AI Free
            </div>
          )}
        </div>

        {/* Details & Prompt Panel */}
        <div className="p-6 bg-[#161616] border-t border-white/5 space-y-4">
          {/* Prompt card */}
          {media.prompt && (
            <div className="relative p-3.5 rounded-xl bg-surface border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-primary-hover tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  Prompt
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-medium select-text">
                {media.prompt}
              </p>
            </div>
          )}

          {/* Badges footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/40 font-semibold pt-1">
            <div className="flex items-center space-x-3">
              <Badge variant="primary">{media.model_name || 'AI Diffusion'}</Badge>
              {media.aspect_ratio && <span>Ratio: {media.aspect_ratio}</span>}
              {media.duration && <span>Duration: {media.duration}s</span>}
            </div>
            {media.cost !== undefined && (
              <span className="text-warning font-bold">
                Cost: {formatCredits(media.cost)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
