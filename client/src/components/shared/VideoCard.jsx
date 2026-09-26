// client/src/components/shared/VideoCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Trash, Share2, Globe, Lock, AlertCircle, Info, Crown } from 'lucide-react';
import { formatDate, formatCredits } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PLACEHOLDER_THUMB = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500';

/**
 * Extracts a single frame from a video URL using an off-screen canvas.
 * Returns a data:image/jpeg;base64... string or null on failure.
 */
async function extractVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = videoUrl;

    const timeout = setTimeout(() => {
      video.src = '';
      resolve(null);
    }, 10000);

    video.onloadedmetadata = () => {
      // Seek to 1 second (or 10% of duration, whichever is smaller)
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        clearTimeout(timeout);
        video.src = '';
        resolve(dataUrl);
      } catch {
        clearTimeout(timeout);
        video.src = '';
        resolve(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
  });
}

export default function VideoCard({
  video,
  watermarkRequired = false,
  onPlay = null,
  onDelete = null,
  onToggleShare = null,
  onRename = null,
  showActions = true
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [thumbnail, setThumbnail] = useState(
    // Use existing thumbnail if it's NOT the stale placeholder
    video.thumbnail_url && video.thumbnail_url !== PLACEHOLDER_THUMB
      ? video.thumbnail_url
      : null
  );
  const thumbnailExtracted = useRef(false);

  const isImage = video.generation_type === 'image' || (video.video_url && /\.(jpg|jpeg|png|webp)($|\?)/i.test(video.video_url));

  // Auto-extract thumbnail if the stored one is the Unsplash placeholder
  useEffect(() => {
    if (
      video.status === 'completed' &&
      video.video_url
    ) {
      if (isImage) {
        setThumbnail(video.video_url);
        return;
      }
      if (!thumbnail && !thumbnailExtracted.current) {
        thumbnailExtracted.current = true;
        extractVideoThumbnail(video.video_url).then((dataUrl) => {
          if (dataUrl) {
            setThumbnail(dataUrl);
            // Persist extracted thumbnail to DB silently (best-effort, no error shown to user)
            api.patch(`/generate/${video.id}`, { thumbnail_url: dataUrl }).catch(() => {});
          }
        });
      }
    }
  }, [video.status, video.video_url, isImage]);

  // ─── Download (gated for free users) ───────────────────────────────────────
  const handleDownload = async (e) => {
    e.stopPropagation();

    if (watermarkRequired) {
      toast.error('⚠️ Download is only available for paid users. Purchase credits to unlock watermark-free downloads.', {
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading('Preparing download...');
    try {
      const response = await fetch(video.video_url);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandvox-${(video.title || 'video').replace(/\s+/g, '-')}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download complete!', { id: toastId });
    } catch (err) {
      toast.error('Failed to download video.', { id: toastId });
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this video?')) {
      setDeleting(true);
      try {
        await onDelete(video.id);
        toast.success('Video removed.');
      } catch (err) {
        toast.error('Delete failed.');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    setSharing(true);
    try {
      await onToggleShare(video.id, !video.is_public);
      toast.success(video.is_public ? 'Video set to private.' : 'Video shared to public gallery!');
    } catch (err) {
      toast.error('Failed to change sharing configurations.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/explore?search=${encodeURIComponent(video.title)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Public link copied to clipboard!');
  };

  return (
    <div
      className="relative flex flex-col bg-surface border border-white/5 rounded-xl overflow-hidden hover-scale group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Video Preview Panel ─────────────────────────────── */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {video.status === 'completed' ? (
          video.video_url ? (
            <div className="relative w-full h-full cursor-pointer" onClick={() => onPlay && onPlay(video)}>

              {/* Media element: either Image or Video */}
              {isImage ? (
                <img
                  src={video.video_url}
                  alt={video.title || 'AI Image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                hovered ? (
                  <video
                    src={video.video_url}
                    muted
                    autoPlay
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title || 'Video thumbnail'}
                      className="w-full h-full object-cover"
                      onError={() => setThumbnail(null)}
                    />
                  ) : (
                    /* Thumbnail still extracting — show subtle loading state */
                    <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-black/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                    </div>
                  )
                )
              )}

              {/* Premium Watermark Overlay for Free Tier */}
              {watermarkRequired && (
                <>
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 text-[9px] font-black uppercase text-primary pointer-events-none select-none tracking-widest z-20 animate-pulse">
                    BrandVox AI Free
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                    <span className="text-white/10 text-2xl font-black uppercase tracking-widest -rotate-25 whitespace-nowrap">
                      BrandVox AI
                    </span>
                  </div>
                </>
              )}

              {/* Hover play/view button */}
              {hovered && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 transition-opacity">
                  <button className="bg-primary hover:bg-primary-hover p-3 rounded-full text-white shadow-glow transform scale-110 active:scale-95 transition-all">
                    {isImage ? <Globe className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/30 text-xs">No media file.</div>
          )
        ) : video.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-surface-elevated/40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-white/50 tracking-wider">Generating {isImage ? 'image' : 'video'}...</span>
          </div>
        ) : video.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full bg-red-950/20">
            <AlertCircle className="w-6 h-6 text-error mb-1.5 animate-bounce" />
            <span className="text-xs text-error font-bold tracking-wide">Generation Failed</span>
            <p className="text-[10px] text-white/35 mt-1 truncate max-w-[200px]" title={video.error_message}>
              {video.error_message || 'API request timeout.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-white/30">
            <Info className="w-5 h-5 mb-1 animate-pulse" />
            <span className="text-xs">Queue position pending</span>
          </div>
        )}
      </div>

      {/* ── Title & Metadata ─────────────────────────────────── */}
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-bold text-white truncate max-w-[180px]" title={video.title}>
              {video.title || 'Untitled Creation'}
            </h3>
            <Badge variant={video.status === 'completed' ? 'success' : video.status === 'failed' ? 'error' : 'warning'}>
              {video.status}
            </Badge>
          </div>
          <p className="text-[10.5px] text-white/50 leading-relaxed mt-2.5 line-clamp-2 h-8" title={video.prompt}>
            {video.prompt}
          </p>
        </div>

        {/* Info badges footer */}
        <div className="flex items-center justify-between border-t border-white/5 mt-4 pt-3.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">
          <div className="flex space-x-2">
            <span>{video.duration}s</span>
            <span>•</span>
            <span>{video.aspect_ratio}</span>
          </div>
          <span>Cost: {formatCredits(video.cost || 0)}</span>
        </div>

        {/* ── Action Buttons ──────────────────────────────────── */}
        {showActions && video.status === 'completed' && (
          <div className="flex items-center justify-between border-t border-white/5 mt-3 pt-3">
            <div className="flex space-x-1.5">

              {/* Download — locked behind paid tier */}
              <button
                onClick={handleDownload}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer group/dl relative ${
                  watermarkRequired
                    ? 'text-white/20 hover:text-warning hover:bg-warning/5'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                }`}
                title={watermarkRequired ? 'Purchase credits to download watermark-free' : 'Download MP4'}
              >
                {watermarkRequired
                  ? <Crown className="w-4 h-4" />
                  : <Download className="w-4 h-4" />
                }
              </button>

              {onToggleShare && (
                <button
                  onClick={handleShareClick}
                  disabled={sharing}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    video.is_public ? 'text-success hover:bg-success/5' : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                  title={video.is_public ? 'Set Private' : 'Make Public'}
                >
                  {video.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              )}

              {video.is_public && (
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg text-primary-hover hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy Share Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg text-error/60 hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
                title="Delete Generation"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
