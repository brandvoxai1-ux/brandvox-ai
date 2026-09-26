// client/src/components/shared/ImageUploader.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * ImageUploader
 * Pure file dropzone for target character & reference images (JPEG, PNG, WebP, GIF up to 20MB).
 * Automatically uploads file to ephemeral cloud storage for the AI pipeline.
 */
export default function ImageUploader({ value, onUrlReady, onClear, compact = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB.');
      return;
    }

    setFileName(file.name);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const permanentUrl = res.data.url;
      setPreview(permanentUrl);
      onUrlReady(permanentUrl);
      toast.success('Character image uploaded successfully!');
    } catch (err) {
      setPreview(null);
      setFileName('');
      toast.error(err?.response?.data?.error || 'Upload failed. Please try again.');
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

  // Preview Mode — image uploaded
  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video w-full bg-black group shadow-lg">
        <img
          src={preview}
          alt="Character preview"
          className="w-full h-full object-contain"
        />
        {uploading && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Uploading photo...</span>
          </div>
        )}
        {!uploading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/80 hover:bg-error text-white p-1 rounded-full transition-colors z-10 cursor-pointer shadow-md"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3 text-primary" />
          <span className="truncate max-w-[150px]">{fileName || 'Target Character'}</span>
        </div>
      </div>
    );
  }

  // Upload Dropzone Mode
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all select-none ${
        isDragging
          ? 'border-primary bg-primary/10 scale-[0.99]'
          : 'border-white/15 hover:border-primary/50 bg-white/[0.02] hover:bg-white/[0.04]'
      } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {uploading ? (
        <div className="flex flex-col items-center justify-center py-3 space-y-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-[11px] font-bold text-white/90">Uploading character image...</p>
          <p className="text-[9px] text-white/40">Preparing reference photo for swap</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-2.5 space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <Upload className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/90">
              Choose Character Photo
            </p>
            <p className="text-[9px] text-white/40 mt-0.5">
              Drag & drop or click to browse (PNG, JPG, WebP · max 20MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
