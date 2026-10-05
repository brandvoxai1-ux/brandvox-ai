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
    <header className="flex items-center justify-between w-full h-14 md:h-16 px-3 sm:px-6 bg-surface border-b border-white/5 select-none z-30">
      {/* LEFT PANEL: Editable Title */}
      <div className="flex items-center space-x-2 md:space-x-3 shrink-0 md:w-1/3">
        {onRename ? (
          isEditing ? (
            <div className="flex items-center space-x-1 bg-surface-elevated px-2 py-1 rounded-lg border border-primary/30">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
                className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none w-28 sm:w-44"
              />
              <button onClick={handleRenameSubmit} className="text-success hover:text-green-400">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 group">
              <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-[100px] sm:max-w-[200px]">
                {title || 'Untitled Video'}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-60 sm:opacity-0 group-hover:opacity-100 text-white/40 hover:text-white p-1 rounded-md transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )
        ) : (
          <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase truncate max-w-[130px] sm:max-w-none">
            {title || 'BrandVox AI'}
          </h2>
        )}
      </div>

      {/* CENTER PANEL: Sub Tab Navigation Pills */}
      <div className="flex items-center justify-center flex-1 mx-1.5 md:w-1/3">
        {tabs.length > 0 && setActiveTab && (
          <div className="flex bg-surface-elevated p-0.5 sm:p-1 rounded-lg border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-md tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Balance Indicators & Primary CTA */}
      <div className="flex items-center justify-end space-x-1.5 sm:space-x-3 shrink-0 md:w-1/3">
        {/* Credits Badge */}
        <div
          onClick={() => navigate('/credits')}
          className="flex items-center space-x-1.5 sm:space-x-2 bg-surface-elevated px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/5 select-none cursor-pointer hover:border-white/15 transition-colors"
          title="Credits Balance — Click to top up"
        >
          <Coins className="w-3.5 h-3.5 text-warning shrink-0" />
          <div className="flex flex-col text-right">
            <span className="hidden sm:block text-[9px] text-white/40 uppercase font-bold tracking-wider leading-none">Balance</span>
            <span className="text-[11px] sm:text-xs font-black text-warning">
              {formatCredits(profile?.credits || 0)}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSyncCredits();
            }}
            className={`hidden sm:block text-white/40 hover:text-white transition-colors cursor-pointer ${
              syncing ? 'animate-spin text-primary' : ''
            }`}
            title="Sync Balance"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Notification Bell (Hidden on small mobile since it's on bottom nav) */}
        <div className="hidden sm:block">
          <NotificationBell onOpenDrawer={onOpenNotifications} />
        </div>

        {/* Global Action / Generate Button */}
        {actionButton && (
          <div className="shrink-0 scale-90 sm:scale-100 origin-right">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
}
