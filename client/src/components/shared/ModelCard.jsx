// client/src/components/shared/ModelCard.jsx
import React from 'react';
import { Sparkles, Cpu, Volume2, Image } from 'lucide-react';

export default function ModelCard({ model, selected = false, onClick = null }) {
  const providerIcons = {
    bytedance: Sparkles,
    alibaba: Cpu,
    default: Cpu
  };

  const IconComponent = providerIcons[model.provider?.toLowerCase()] || providerIcons.default;

  // Build capability chips: top resolution + duration range
  const topRes = model.supported_resolutions?.slice(-1)[0]?.toUpperCase() || '720P';
  const maxDur = model.max_duration || 15;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
        selected
          ? 'bg-primary/12 border border-primary/50 ring-1 ring-primary/30 shadow-glow'
          : 'bg-transparent hover:bg-white/5 border border-transparent'
      }`}
    >
      {/* Provider icon avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        selected ? 'bg-primary/25 text-primary-hover' : 'bg-white/7 text-white/50 group-hover:bg-white/10'
      }`}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Model name + capability chips */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] font-bold leading-none ${selected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
            {model.name}
          </span>
          {model.badge && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/20 text-primary-hover border border-primary/25 leading-none">
              {model.badge}
            </span>
          )}
        </div>

        {/* Higgsfield-style capability chips */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{topRes}</span>
          <span className="text-white/15">·</span>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">4s–{maxDur}s</span>
          {model.supports_audio && (
            <>
              <span className="text-white/15">·</span>
              <Volume2 className="w-2.5 h-2.5 text-white/35" />
            </>
          )}
          {model.supports_image_input && (
            <>
              <span className="text-white/15">·</span>
              <Image className="w-2.5 h-2.5 text-white/35" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
