// client/src/components/shared/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function NotificationBell({ onOpenDrawer = null }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchBellNotifications = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Get count of unread
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);

      // Get last 3 notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setNotifications(data || []);
    } catch (err) {
      console.error('[NotificationBell] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBellNotifications();

    // Subscribe to realtime database changes for notifications
    if (!profile?.id) return;
    
    const channelId = `bell-notif-${profile.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => {
          fetchBellNotifications();
        }
      )
      .subscribe();

    // Click outside handler to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profile?.id]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
        toast.success('Alert marked as read.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All alerts marked read.');
        setIsOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Glowing Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all cursor-pointer ${
          isOpen ? 'bg-primary/20 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
        }`}
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 glass-premium rounded-xl py-2 px-1 text-xs border border-white/10 z-50 shadow-premium animate-fade-in origin-top-right">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1.5">
            <span className="font-extrabold text-white uppercase tracking-wider">Recent Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-primary-hover hover:underline font-bold cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="w-4 h-4 animate-spin text-white/30" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-white/30 py-6 font-semibold">No recent alerts.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-start justify-between space-x-2 ${
                    notif.is_read ? 'text-white/40 hover:bg-white/5' : 'bg-surface-elevated/50 text-white hover:bg-surface-elevated'
                  }`}
                >
                  <div className="space-y-0.5 truncate flex-1">
                    <h5 className="font-bold text-white truncate tracking-wide">{notif.title}</h5>
                    <p className="text-[10px] text-white/50 leading-relaxed truncate">{notif.message}</p>
                    <span className="text-[8px] text-white/20 block">{formatDate(notif.created_at)}</span>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="p-1 rounded bg-primary/10 hover:bg-primary text-primary-hover hover:text-white cursor-pointer"
                      title="Mark read"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom view all link */}
          {onOpenDrawer && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDrawer();
              }}
              className="w-full flex items-center justify-center space-x-1 py-2 mt-1.5 border-t border-white/5 text-primary-hover hover:underline font-bold text-[10px] uppercase tracking-wider cursor-pointer"
            >
              <span>View All Alerts</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
