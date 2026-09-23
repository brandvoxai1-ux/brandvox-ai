// client/src/components/shared/ImageUploader.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * ImageUploader
 * Dual-mode: drag-and-drop file upload OR paste a direct URL.
 * On upload success, calls onUrlReady(url) with the permanent public URL.
 */
export default function ImageUploader({ value, onUrlReady, onClear }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [urlInput, setUrlInput] = useState('');
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

    // Show local preview immediately
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
      toast.success('Image uploaded successfully!');
    } catch (err) {
      setPreview(null);
      toast.error(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  }, [onUrlReady]);

  // Drag events
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
    if (!trimmed) { toast.error('Please enter an image URL.'); return; }
    try {
      new URL(trimmed); // validate
      setPreview(trimmed);
      onUrlReady(trimmed);
      toast.success('Image URL applied.');
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

  return (
    <div className="space-y-3">
      {/* Mode Tab Switcher */}
      <div className="flex bg-surface-elevated rounded-lg border border-white/5 p-0.5 text-[10px] font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            mode === 'upload' ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Upload className="w-3 h-3" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            mode === 'url' ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Link className="w-3 h-3" />
          Paste URL
        </button>
      </div>

      {/* Preview (if we have an image) */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video w-full bg-black">
          <img
            src={preview}
            alt="Source image preview"
            className="w-full h-full object-contain"
            onError={() => { setPreview(null); toast.error('Could not load image from URL.'); }}
          />
          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Uploading...</span>
            </div>
          )}
          {/* Clear button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/80 text-white/70 hover:text-white p-1 rounded-full transition-all border border-white/10"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone (upload mode) */}
      {!preview && mode === 'upload' && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-white/10 hover:border-primary/50 hover:bg-white/3 bg-surface-elevated'
            }`}
          >
            <div className={`p-3 rounded-full mb-3 transition-all ${isDragging ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/30'}`}>
              {uploading
                ? <Loader2 className="w-6 h-6 animate-spin" />
                : <ImageIcon className="w-6 h-6" />
              }
            </div>
            {uploading ? (
              <p className="text-[10.5px] font-bold text-primary tracking-wide">Uploading to cloud storage...</p>
            ) : isDragging ? (
              <p className="text-[10.5px] font-bold text-primary tracking-wide">Drop to upload!</p>
            ) : (
              <>
                <p className="text-[10.5px] font-bold text-white/50 tracking-wide">Drop image here or click to browse</p>
                <p className="text-[9px] text-white/25 font-semibold mt-1 uppercase tracking-wider">JPEG · PNG · WebP · GIF — Max 20 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleInputChange}
              disabled={uploading}
            />
          </div>
        </>
      )}

      {/* URL input (url mode) */}
      {!preview && mode === 'url' && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="flex-1 bg-surface-elevated text-xs rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-primary text-white/80 placeholder-white/20"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase rounded-lg transition-colors shrink-0"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
