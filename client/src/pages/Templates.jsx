// client/src/pages/Templates.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templatesData';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  Search,
  Play,
  Copy,
  ArrowRight,
  X,
  Cpu,
  Layers,
  Check,
  Film,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Templates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all'); // 'all' | 'video' | 'image'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filter templates
  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
    const matchesMedia = selectedMediaType === 'all' || tpl.media_type === selectedMediaType;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tpl.model_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesMedia && matchesSearch;
  });

  const handleUseTemplate = (template) => {
    navigate('/studio', {
      state: {
        template: {
          title: template.title,
          prompt: template.prompt,
          model_id: template.model_id,
          media_type: template.media_type,
          aspect_ratio: template.aspect_ratio,
          duration: template.duration
        }
      }
    });
  };

  const handleCopyPrompt = (e, template) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      {/* Top Navigation Header */}
      <Topbar title="AI Creative Templates" />

      {/* Main Content Scroll Area */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Banner Hero */}
        <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-primary/20 via-purple-900/10 to-transparent border border-white/8 overflow-hidden select-none">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary-hover text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Trending Social & E-Com Presets</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              Launch Viral Videos & Ads in 1-Click
            </h1>
            <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">
              Battle-tested prompt formulas with engineered lighting, camera motions, and exact model parameters ready for immediate compilation.
            </p>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface border border-white/5 p-4 rounded-2xl select-none">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar + Media type filter */}
          <div className="flex items-center gap-3">
            {/* Media type toggle */}
            <div className="flex bg-surface-elevated p-1 rounded-xl border border-white/5 text-[11px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'video', label: 'Videos' },
                { id: 'image', label: 'Images' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSelectedMediaType(id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedMediaType === id ? 'bg-primary text-white shadow-xs' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[200px] md:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates, styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-elevated text-xs rounded-xl pl-9 pr-3 py-2 border border-white/10 w-full focus:outline-none focus:border-primary text-white/90"
              />
            </div>
          </div>
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Layers className="w-10 h-10 text-white/20" />
            <h3 className="text-sm font-bold text-white">No templates match your filters</h3>
            <p className="text-xs text-white/40">Try selecting "All Templates" or clearing your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setActiveModalTemplate(template)}
                className="group bg-surface border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden hover-scale transition-all flex flex-col justify-between cursor-pointer shadow-lg"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={template.preview_image_url}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Optional hover video preview if available */}
                  {template.preview_video_url && (
                    <video
                      src={template.preview_video_url}
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      onMouseEnter={(e) => e.target.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-primary-hover border border-white/10">
                      {template.badge || template.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/60 backdrop-blur-md text-white/70">
                      {template.aspect_ratio}
                    </span>
                  </div>

                  {/* Hover Quick-Launch overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                    <span className="text-[10px] font-bold text-white/90 flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-primary-hover fill-primary-hover" />
                      Click for instant studio preview
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary-hover transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    <p className="text-[11px] text-white/45 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {template.prompt}
                    </p>
                  </div>

                  {/* Bottom Metadata & Action Buttons */}
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-semibold">
                      <span className="flex items-center gap-1 text-white/60">
                        <Cpu className="w-3 h-3 text-primary-hover" />
                        {template.model_name}
                      </span>
                      <span>{template.duration > 0 ? `${template.duration}s` : '1-Click'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCopyPrompt(e, template)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title="Copy prompt formula"
                      >
                        {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-[11px] font-bold py-1.5 shadow-premium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                      >
                        Use Template ➔
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK-LAUNCH DETAIL MODAL */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary-hover flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeModalTemplate.title}</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    {activeModalTemplate.category} · {activeModalTemplate.media_type.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalTemplate(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Media Player */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                {activeModalTemplate.preview_video_url ? (
                  <video
                    src={activeModalTemplate.preview_video_url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeModalTemplate.preview_image_url}
                    alt={activeModalTemplate.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Engineered Prompt Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Engineered Prompt Formula</span>
                  <button
                    onClick={(e) => handleCopyPrompt(e, activeModalTemplate)}
                    className="text-primary-hover hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="p-3 bg-surface-elevated border border-white/8 rounded-xl text-xs text-white/80 font-medium leading-relaxed">
                  {activeModalTemplate.prompt}
                </div>
              </div>

              {/* Template Parameters Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-elevated p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-white/40 uppercase font-black block">Recommended Model</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{activeModalTemplate.model_name}</span>
                </div>
                <div className="bg-surface-elevated p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-white/40 uppercase font-black block">Aspect Ratio</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{activeModalTemplate.aspect_ratio}</span>
                </div>
                <div className="bg-surface-elevated p-2.5 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-white/40 uppercase font-black block">Duration</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{activeModalTemplate.duration > 0 ? `${activeModalTemplate.duration}s` : 'Single Frame'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 border-t border-white/8 bg-[#0D0D0D] flex items-center justify-between">
              <span className="text-xs text-white/40">
                Click customize to open this setup in the Studio
              </span>
              <Button
                variant="primary"
                onClick={() => {
                  const t = activeModalTemplate;
                  setActiveModalTemplate(null);
                  handleUseTemplate(t);
                }}
                className="shadow-premium px-5"
              >
                Customize in Studio ➔
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
