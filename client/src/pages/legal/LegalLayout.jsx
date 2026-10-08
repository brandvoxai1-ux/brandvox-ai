// client/src/pages/legal/LegalLayout.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Cookie, RefreshCw } from 'lucide-react';

export default function LegalLayout({ title, lastUpdated, children }) {
  const navigate = useNavigate();

  const legalNav = [
    { name: 'Privacy Policy', path: '/privacy', icon: Shield },
    { name: 'Terms of Service', path: '/terms', icon: FileText },
    { name: 'Cookie Policy', path: '/cookie-policy', icon: Cookie },
    { name: 'Refund Policy', path: '/refund-policy', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#141414]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
            className="flex items-center space-x-2 text-xs font-bold text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-xs text-white">
              B
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white">
              BrandVox <span className="text-primary-hover">AI</span>
            </span>
          </Link>
        </div>

        <nav className="hidden sm:flex items-center space-x-2">
          {legalNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        <div className="mb-10 pb-6 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-hover">
            Last Updated: {lastUpdated || 'October 2026'}
          </p>
        </div>

        <article className="prose prose-invert max-w-none text-white/80 leading-relaxed text-sm md:text-[15px] space-y-6">
          {children}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#121212] py-8 px-6 text-center text-xs text-white/50">
        <p>© 2026 BrandVox AI. All rights reserved.</p>
        <p className="mt-1 text-white/40">Registered jurisdiction: India · Billed in INR</p>
      </footer>
    </div>
  );
}
