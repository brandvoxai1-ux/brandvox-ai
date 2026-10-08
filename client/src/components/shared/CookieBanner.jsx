// client/src/components/shared/CookieBanner.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Check } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('brandvox_cookie_consent');
    if (!consent) {
      // Small timeout so it slides in smoothly after first paint
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('brandvox_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('brandvox_cookie_consent', 'dismissed');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Local Storage Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in"
    >
      <div className="bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary-hover shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Privacy & Storage Notice
            </h4>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss cookie notice"
            className="text-white/40 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-white/70 leading-relaxed">
          BrandVox AI uses essential local storage to maintain your login session and secure your creative credits. We do not use third-party advertising tracking cookies. Read our{' '}
          <Link to="/cookie-policy" className="text-primary-hover hover:underline font-semibold">
            Cookie Policy
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary-hover hover:underline font-semibold">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex items-center justify-end space-x-2 pt-1">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Essential Only
          </button>
          <button
            onClick={handleAccept}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all shadow-premium focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
