// client/src/components/shared/UnifiedMediaUploader.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Music, Upload, X, Loader2, Plus, Film } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * UnifiedMediaUploader
 * Higgsfield-style single media dropzone accepting Images, Videos, and Audios.
 * Automatically tags assets as @Video1, @Image1, @Audio1 and detects orientation.
 */
export default function UnifiedMediaUploader({ assets = [], onChange, onOrientationDetected, onDurationDetected }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploading(true);

    try {
      const newAssets = [...assets];

      for (const file of files) {
        const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|3gp|m4v)$/i.test(file.name);
        const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
        const isAudio = file.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name);

        if (!isVideo && !isImage && !isAudio) {
          toast.error(`"${file.name}" is not a supported media file.`);
          continue;
        }

        if (file.size > 500 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds maximum 500MB limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        let endpoint = '/upload/image';
        let mediaType = 'image';

        if (isVideo) {
          endpoint = '/upload/video';
          mediaType = 'video';
        }

        // Quick probe dimensions / duration locally
        const localUrl = URL.createObjectURL(file);
        let duration = null;
        let width = null;
        let height = null;

        if (isVideo) {
          try {
            const meta = await new Promise((resolve) => {
              const v = document.createElement('video');
              v.preload = 'metadata';
              v.onloadedmetadata = () => resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
              v.onerror = () => resolve(null);
              v.src = localUrl;
            });
            if (meta) {
              duration = meta.duration;
              width = meta.width;
              height = meta.height;
              // Detect orientation and notify parent immediately
              if (meta.height > meta.width && onOrientationDetected) {
                onOrientationDetected('9:16');
              } else if (meta.width >= meta.height && onOrientationDetected) {
                onOrientationDetected('16:9');
              }
              if (meta.duration && onDurationDetected) {
                onDurationDetected(meta.duration);
              }
            }
          } catch (_) {}
        } else if (isImage) {
          try {
            const meta = await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
              img.onerror = () => resolve(null);
              img.src = localUrl;
            });
            if (meta) {
              width = meta.width;
              height = meta.height;
              if (meta.height > meta.width && onOrientationDetected && !assets.some(a => a.type === 'video')) {
                onOrientationDetected('9:16');
              }
            }
          } catch (_) {}
        }

        URL.revokeObjectURL(localUrl);

        const res = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000
        });

        const uploadedUrl = res.data.url;
        const typeIndex = newAssets.filter(a => a.type === mediaType).length + 1;
        const tag = `@${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}${typeIndex}`;

        newAssets.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: mediaType,
          tag,
          url: uploadedUrl,
          name: file.name,
          duration,
          width,
          height
        });
      }

      onChange(newAssets);
      toast.success('Media uploaded successfully!');
    } catch (err) {
      console.error('[UnifiedMediaUploader] Upload failed:', err);
      toast.error(err.response?.data?.error || err.message || 'Media upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [assets, onChange, onOrientationDetected]);

  const removeAsset = (id) => {
    const filtered = assets.filter(a => a.id !== id);
    // Re-tag remaining assets cleanly
    const reindexed = filtered.map(item => {
      const sameType = filtered.filter(f => f.type === item.type);
      const idx = sameType.findIndex(f => f.id === item.id) + 1;
      return {
        ...item,
        tag: `@${item.type.charAt(0).toUpperCase() + item.type.slice(1)}${idx}`
      };
    });
    onChange(reindexed);
  };

  const hasAssets = assets && assets.length > 0;

  return (
    <div className="space-y-3">
      {/* Higgsfield Single Dropzone Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border transition-all cursor-pointer overflow-hidden p-5 flex flex-col items-center justify-center text-center select-none ${
          isDragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[0.99]'
            : 'border-white/12 bg-[#121316] hover:border-white/25 hover:bg-[#16171b]'
        } ${uploading ? 'pointer-events-none opacity-85' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="unified-media-file-input"
          name="mediaFiles"
          aria-label="Upload media files"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="py-3 flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 text-yellow-400 animate-spin" />
            <p className="text-xs font-semibold text-white/90">Processing & uploading media...</p>
            <p className="text-[10px] text-white/40">Conforming to AI pipeline</p>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center">
            {/* Higgsfield Overlapping Icon Badges */}
            <div className="flex items-center justify-center gap-1.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-inner">
                <ImageIcon className="w-4 h-4 text-white/80" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-inner">
                <VideoIcon className="w-4 h-4 text-white/80" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-inner">
                <Music className="w-4 h-4 text-white/80" />
              </div>
            </div>

            <p className="text-xs font-bold text-white tracking-wide">Upload media</p>
            <p className="text-[11px] text-white/45 mt-0.5">Image, Video or Audio</p>
          </div>
        )}
      </div>

      {/* Uploaded Asset Chips (Thumbnails with @Tag) */}
      {hasAssets && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-2 bg-[#1a1b20] border border-white/15 rounded-xl px-2.5 py-1.5 shadow-md group hover:border-yellow-400/50 transition-all"
            >
              {/* Media Thumbnail */}
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10 relative flex items-center justify-center">
                {asset.type === 'video' ? (
                  <video src={asset.url} className="w-full h-full object-cover" muted />
                ) : asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.tag} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-3.5 h-3.5 text-yellow-400" />
                )}
              </div>

              {/* Tag & Info */}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-yellow-300 font-mono tracking-tight leading-none">
                  {asset.tag}
                </span>
                <span className="text-[9px] text-white/50 truncate max-w-[100px] leading-tight mt-0.5">
                  {asset.duration ? `${asset.duration.toFixed(1)}s` : asset.type}
                </span>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                className="w-4 h-4 rounded-full bg-white/10 hover:bg-red-500/80 text-white/60 hover:text-white flex items-center justify-center transition-colors ml-1 cursor-pointer"
                title="Remove asset"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Quick Add More button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3 text-yellow-400" />
            <span>Add more</span>
          </button>
        </div>
      )}
    </div>
  );
}
