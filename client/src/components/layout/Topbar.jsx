// client/src/components/layout/Topbar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatCredits } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Coins, Edit2, Check, RefreshCw } from 'lucide-react';
import NotificationBell from '../shared/NotificationBell';

export default function Topbar({
  title = '',
  onRename = null,
  activeTab = '',
  setActiveTab = null,
  tabs = [],
  actionButton = null,
  onOpenNotifications = null
}) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleRenameSubmit = () => {
    if (editedTitle.trim() && editedTitle !== title && onRename) {
      onRename(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleSyncCredits = async () => {
    setSyncing(true);
    await refreshProfile();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <header className="flex items-center justify-between w-full h-14 sm:h-16 px-3 sm:px-6 bg-[#000000]/90 backdrop-blur-md border-b border-white/8 select-none z-30 shrink-0">
      {/* LEFT PANEL: Logo / Title */}
      <div className="flex items-center space-x-2 shrink-0 max-w-[150px] sm:max-w-none">
        {onRename ? (
          isEditing ? (
            <div className="flex items-center space-x-1 bg-surface-elevated px-2 py-1 rounded-xl border border-primary/40">
              <input
                type="text"
                id="topbar-title-input"
                name="projectTitle"
                aria-label="Project title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
                className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none w-24 sm:w-44"
              />
              <button onClick={handleRenameSubmit} className="text-success hover:text-green-400">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-[110px] sm:max-w-[200px]">
                {title || 'Untitled Video'}
              </h2>
              <Edit2 className="w-3 h-3 text-white/30 group-hover:text-white transition-colors" />
            </div>
          )
        ) : (
          <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => navigate('/explore')}>
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide font-['Outfit'] flex items-center gap-1">
              BrandVox AI <span className="text-purple-400 text-xs">✨</span>
            </h2>
          </div>
        )}
      </div>

      {/* CENTER PANEL: Sub Tab Navigation Pills */}
      <div className="flex items-center justify-center flex-1 mx-1 md:w-1/3">
        {tabs.length > 0 && setActiveTab && (
          <div className="flex bg-[#12131D] p-1 rounded-xl border border-white/8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 sm:px-4 py-1 text-[10px] sm:text-xs font-bold rounded-lg tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-purple text-white shadow-md'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Balance Indicators & PRO Badge */}
      <div className="flex items-center justify-end space-x-2 shrink-0">
        {/* Phant AI Style PRO / Credit Pill */}
        <div
          onClick={() => navigate('/credits')}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-indigo-950/60 hover:from-purple-900/80 hover:to-indigo-900/80 px-2.5 sm:px-3 py-1.5 rounded-full border border-purple-500/30 select-none cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Credits Balance — Click to recharge"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
            <span>💎</span> PRO
          </span>
          <span className="text-white/30 text-[10px]">•</span>
          <span className="text-[11px] font-black text-white flex items-center gap-1">
            🪙 {formatCredits(profile?.credits || 0)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSyncCredits();
            }}
            className={`text-white/40 hover:text-white transition-colors cursor-pointer ml-0.5 ${
              syncing ? 'animate-spin text-purple-400' : ''
            }`}
            title="Sync Balance"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Notification Bell (Hidden on mobile) */}
        <div className="hidden sm:block">
          <NotificationBell onOpenDrawer={onOpenNotifications} />
        </div>

        {/* Global Action / Generate Button (Desktop header — on mobile this is docked in the Thumb Zone) */}
        {actionButton && (
          <div className="shrink-0 scale-90 sm:scale-100 origin-right hidden lg:block">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
}
