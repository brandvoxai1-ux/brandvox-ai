// client/src/components/layout/AppLayout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Bell, X, CheckSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

export default function AppLayout({ children }) {
  const { profile } = useAuth();
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('[AppLayout] Failed to retrieve alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notifDrawerOpen && profile?.id) {
      fetchNotifications();
    }
  }, [notifDrawerOpen, profile?.id]);

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        toast.success('All alerts marked read.');
      } else {
        throw error;
      }
    } catch (err) {
      toast.error('Failed to mark notifications read.');
    }
  };

  const handleToggle = () => {
    setNotifDrawerOpen(!notifDrawerOpen);
  };

  return (
    <div className="flex w-screen h-[100dvh] bg-darkBg text-white overflow-hidden">
      {/* 64px width Sidebar */}
      <Sidebar toggleNotifications={handleToggle} />

      {/* Main Page Content panel */}
      <main className="flex flex-col flex-grow h-[100dvh] overflow-hidden pb-16 md:pb-0 relative">
        {children}

        {/* Right slide-in notification drawer */}
        {notifDrawerOpen && (
          <>
            <div
              className="fixed inset-0 z-45 bg-black/60 backdrop-blur-xs"
              onClick={() => setNotifDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-80 bg-surface border-l border-white/5 shadow-premium p-6 flex flex-col z-50 transition-all duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4.5 h-4.5 text-primary-hover" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alerts History</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {notifications.some(n => !n.is_read) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-white/40 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                      title="Mark All Read"
                    >
                      <CheckSquare className="w-4.5 h-4.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setNotifDrawerOpen(false)}
                    className="text-white/40 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Notification List Scroll panel */}
              <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-5 h-5 animate-spin text-white/20" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-xs text-white/30 py-10 tracking-wider">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const badgeStyles = {
                      success: 'bg-success/15 border-success/20 text-success',
                      error: 'bg-error/15 border-error/20 text-error',
                      warning: 'bg-warning/15 border-warning/20 text-warning',
                      info: 'bg-primary/15 border-primary/20 text-primary-hover'
                    };
                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all hover:bg-surface-hover ${
                          notif.is_read
                            ? 'bg-surface border-white/5 text-white/50'
                            : 'bg-surface-elevated border-white/10 text-white font-medium shadow-premium'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-bold tracking-wider ${
                              badgeStyles[notif.type] || badgeStyles.info
                            }`}
                          >
                            {notif.type}
                          </span>
                          <span className="text-[9px] text-white/30">
                            {formatDate(notif.created_at)}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white mt-2 truncate tracking-wide">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
