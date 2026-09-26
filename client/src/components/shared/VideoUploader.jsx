// client/src/components/shared/VideoUploader.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Video as VideoIcon, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * VideoUploader
 * Pure file dropzone for source motion videos (MP4, WebM, MOV up to 50MB).
 * Automatically uploads file to ephemeral cloud storage for the AI pipeline.
 */
export default function VideoUploader({ value, onUrlReady, onClear, compact = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [fileName, setFileName] = useState('');
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

    setFileName(file.name);
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
      setFileName('');
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

  const handleClear = () => {
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onUrlReady('');
    if (onClear) onClear();
  };

  // Preview Mode — video uploaded
  if (preview) {
    return (
      <div className="space-y-1.5">
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black group shadow-lg">
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
          <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
            <VideoIcon className="w-3 h-3 text-primary" />
            <span className="truncate max-w-[150px]">{fileName || 'Source Motion Video'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-semibold px-0.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>7-day privacy retention active</span>
        </div>
      </div>
    );
  }

  // Upload Dropzone Mode
  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[0.99]'
            : 'border-white/15 hover:border-primary/50 bg-white/[0.02] hover:bg-white/[0.04]'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-3 space-y-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-[11px] font-bold text-white/90">Uploading source video file...</p>
            <p className="text-[9px] text-white/40">Storing temporarily for AI processing</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2.5 space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/90">
                Choose Source Video File
              </p>
              <p className="text-[9px] text-white/40 mt-0.5">
                Drag & drop or click to browse (MP4, WebM, MOV · max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 7-day Ephemeral Notice */}
      <div className="flex items-center gap-1.5 text-[8.5px] text-white/35 font-medium leading-tight px-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400/80 shrink-0" />
        <span>Source video file auto-purged after 7 days for user privacy</span>
      </div>
    </div>
  );
}
