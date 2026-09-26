// client/src/components/shared/VideoUploader.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Video as VideoIcon, Loader2, Link, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * VideoUploader
 * Supports source motion video upload (MP4, WebM, MOV up to 50MB) or direct URL input.
 * Reminds user of the 7-day ephemeral retention policy for privacy.
 */
export default function VideoUploader({ value, onUrlReady, onClear, compact = false }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only MP4, WebM, or MOV video files are allowed.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Source video must be under 50 MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      const permanentUrl = res.data.url;
      setPreview(permanentUrl);
      onUrlReady(permanentUrl);
      toast.success('Source video uploaded successfully!');
    } catch (err) {
      setPreview(null);
      toast.error(err?.response?.data?.error || 'Video upload failed. Please try again.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  }, [onUrlReady]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { toast.error('Please enter a video URL.'); return; }
    try {
      new URL(trimmed);
      setPreview(trimmed);
      onUrlReady(trimmed);
      toast.success('Source video URL applied.');
    } catch {
      toast.error('Please enter a valid URL (starting with https://).');
    }
  };

  const handleClear = () => {
    setPreview(null);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onUrlReady('');
    if (onClear) onClear();
  };

  // Preview Mode
  if (preview) {
    return (
      <div className="space-y-1.5">
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black group">
          <video
            src={preview}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-6 h-6 bg-black/80 hover:bg-error rounded-full flex items-center justify-center text-white transition-colors z-10 cursor-pointer shadow-md"
            title="Remove source video"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1">
            <VideoIcon className="w-2.5 h-2.5 text-primary" />
            Source Motion
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-semibold">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>7-day privacy retention active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode Switcher */}
      <div className="flex bg-surface-elevated rounded-lg border border-white/5 p-0.5 text-[9px] font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
            mode === 'upload' ? 'bg-primary text-white shadow-xs' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Upload className="w-2.5 h-2.5" />
          Upload Video
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
            mode === 'url' ? 'bg-primary text-white shadow-xs' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Link className="w-2.5 h-2.5" />
          Paste Link
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/4'
          } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-white/70">Uploading source video...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-1">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                <VideoIcon className="w-3.5 h-3.5 text-primary/70" />
              </div>
              <p className="text-[10.5px] font-bold text-white/80">
                Click or drop source video
              </p>
              <p className="text-[9px] text-white/40">MP4, WebM, MOV (Max 50MB)</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="url"
              placeholder="https://example.com/source.mp4"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-white/25 focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover rounded-lg text-[10px] font-bold text-white transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* 7-day Ephemeral Notice */}
      <div className="flex items-center gap-1.5 text-[8.5px] text-white/35 font-medium leading-tight px-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400/80 shrink-0" />
        <span>Source video auto-purged after 7 days for user privacy</span>
      </div>
    </div>
  );
}
