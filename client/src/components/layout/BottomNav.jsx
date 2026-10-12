// client/src/components/layout/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, FolderOpen, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      paths: ['/explore', '/templates', '/']
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: Sparkles,
      paths: ['/studio']
    },
    {
      id: 'creations',
      label: 'Creations',
      icon: FolderOpen,
      paths: ['/projects']
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      paths: ['/settings', '/credits']
    }
  ];

  const isCurrentActive = (item) => {
    return item.paths.some(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0E0F18]/95 backdrop-blur-xl border-t border-white/8 flex items-center justify-around px-3 z-50 select-none pb-[env(safe-area-inset-bottom)] shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isCurrentActive(item);

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.paths[0])}
            aria-label={item.label}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <div
              className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-gradient-purple text-white glow-purple'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-wider font-semibold transition-colors ${
                active ? 'text-white' : 'text-white/40'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
