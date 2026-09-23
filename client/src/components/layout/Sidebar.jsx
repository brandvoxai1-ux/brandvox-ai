// client/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  Film,
  FolderOpen,
  LayoutTemplate,
  Compass,
  Coins,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sidebar({ toggleNotifications }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notifications count from Supabase
  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotificationsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false);

        if (!error) {
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error('Count fetch error:', err);
      }
    };

    fetchNotificationsCount();
    
    // Subscribe to realtime updates for notifications
    const channel = supabase
      .channel('schema-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => {
          fetchNotificationsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const menuItems = [
    { id: 'studio', path: '/studio', label: 'Studio', icon: Film },
    { id: 'projects', path: '/projects', label: 'My Videos', icon: FolderOpen },
    { id: 'templates', path: '/templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'explore', path: '/explore', label: 'Explore', icon: Compass },
    { id: 'credits', path: '/credits', label: 'Credits', icon: Coins },
    { id: 'notifications', action: toggleNotifications, label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'settings', path: '/settings', label: 'Settings', icon: Settings }
  ];

  // Insert Admin Link if role === 'admin'
  if (profile?.role === 'admin') {
    menuItems.splice(menuItems.length - 1, 0, {
      id: 'admin',
      path: '/admin',
      label: 'Admin',
      icon: ShieldAlert
    });
  }

  const handleNav = (item) => {
    if (item.action) {
      item.action();
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed.');
    }
  };

  const isActive = (item) => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
    return false;
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (64px Wide, visible on >= md screens) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-16 h-screen py-6 bg-surface border-r border-white/5 shrink-0 select-none z-40">
        {/* Brand Logo Header */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 shadow-md cursor-pointer hover:rotate-6 transition-all duration-300"
        >
          <span className="text-white text-base font-black">B</span>
        </div>

        {/* Core Navigation Items List */}
        <nav className="flex flex-col space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4.5 h-4.5 text-[9px] font-bold text-white bg-error rounded-full border border-surface">
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip Overlay */}
                <span className="absolute left-16 scale-0 group-hover:scale-100 bg-surface-elevated text-xs text-white px-2 py-1 rounded-md border border-white/5 tracking-wider transition-all duration-150 origin-left z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile dropdown actions */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/30 text-white font-bold border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-all duration-200"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </button>

          {/* Premium Dropdown popup */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute bottom-12 left-2 w-48 glass-premium rounded-xl py-2 px-1 text-sm border border-white/10 z-50 shadow-premium animate-fade-in origin-bottom-left">
                <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                  <p className="font-bold text-white truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-white/40 truncate">{profile?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center w-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Settings
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full px-3 py-2 text-error/80 hover:text-error hover:bg-white/5 rounded-lg transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (collapses, visible on < md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-white/5 flex items-center justify-around px-4 z-40 glass">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                active ? 'text-primary' : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-1 right-3 flex items-center justify-center w-4 h-4 text-[8px] font-bold text-white bg-error rounded-full border border-surface">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Mobile Profile Link */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
            location.pathname === '/settings' ? 'text-primary' : 'text-white/40 hover:text-white'
          }`}
        >
          <div className="w-5.5 h-5.5 rounded-full bg-primary/20 border border-primary/20 overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Settings</span>
        </button>
      </nav>
    </>
  );
}
