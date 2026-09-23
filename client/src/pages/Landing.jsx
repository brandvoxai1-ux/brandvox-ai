// client/src/pages/Landing.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  Sparkles,
  Zap,
  Lock,
  Music,
  Coins,
  BarChart,
  ArrowRight,
  Play,
  Star,
  Check,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'support' | 'privacy' | 'terms' | null

  const features = [
    { icon: Film, title: 'Multi-Model Studio', desc: 'Seamlessly switch between MiniMax Hailuo, Kling Video, Wan 2.5, and Ideogram.' },
    { icon: Zap, title: 'Fast Generation', desc: 'High-speed render pipelines ensure your videos and images are ready in minutes.' },
    { icon: Lock, title: 'Private by Default', desc: 'Your generated creations are completely private. We never train models on your assets.' },
    { icon: Music, title: 'Native Audio Support', desc: 'Create cinematic AI-generated videos accompanied by synchronized audio tracks.' },
    { icon: Coins, title: 'Pay As You Go (INR)', desc: 'Buy credit packages with instant UPI QR. No recurring subscriptions or lock-ins.' },
    { icon: BarChart, title: 'Usage Metrics', desc: 'Track generation times, aspect adjustments, and costs in real time.' }
  ];

  const modelsList = [
    { name: 'MiniMax Hailuo', price: '3.5 🪙/s', provider: 'MiniMax', badge: 'Most Popular', desc: 'Cinematic video generation with pristine temporal physics and realism.' },
    { name: 'Kling Video', price: '4.5 🪙/s', provider: 'Kuaishou', badge: 'Director Grade', desc: 'Ultra-smooth motion coherence and high-fidelity rendering.' },
    { name: 'Wan 2.5 Fast', price: '1.5 🪙/s', provider: 'Wan Video', badge: 'High Speed', desc: 'Quick turnaround video diffusion with rich detail.' },
    { name: 'P-Image Ideogram', price: '10 🪙/img', provider: 'Ideogram', badge: 'Image Studio', desc: 'State-of-the-art text rendering and typography image generation.' }
  ];

  // Approved INR Packages
  const pricingPacks = [
    { id: 'starter', name: 'Starter Pack', price: '₹99', credits: '99.00 🪙', bonus: null, desc: 'Perfect for beginners starting to explore.', features: ['99.00 🪙 Balance', 'Full Video & Image Access', 'Standard Generations Queue'] },
    { id: 'creator', name: 'Creator Pack', price: '₹249', credits: '274.00 🪙', bonus: '10% Bonus', desc: 'Most popular option for designers.', features: ['274.00 🪙 Balance', 'Watermark-Free Downloads', 'Priority Generations Queue'] },
    { id: 'pro', name: 'Pro Pack', price: '₹499', credits: '574.00 🪙', bonus: '15% Bonus', desc: 'Unlock premium high-resolution options.', features: ['574.00 🪙 Balance', 'All features included', '24/7 Priority Support'] },
    { id: 'studio', name: 'Studio Pack', price: '₹999', credits: '1,199.00 🪙', bonus: '20% Bonus', desc: 'Ultimate package for agency work.', features: ['1,199.00 🪙 Balance', 'Pristine 1080p outputs', 'Custom aspect integrations', 'Immediate priority execution'] }
  ];

  const testimonials = [
    { initials: 'AK', name: 'Aarav Kumar', role: 'Motion Lead', text: 'BrandVox AI has completely transformed how our design team drafts pitches. Switching between Hailuo and Kling takes seconds!' },
    { initials: 'NP', name: 'Neha Patel', role: 'Agency Director', text: 'Pricing in INR without monthly lock-ins is a total game-changer. Instant UPI top-ups make credit reloads seamless.' },
    { initials: 'RS', name: 'Rohan Sharma', role: 'Content Creator', text: 'The cinematic output on MiniMax Hailuo is jaw-dropping. Highly recommend the Creator and Pro packages!' }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-white selection:bg-primary selection:text-white relative animated-gradient">
      {/* 1. STICKY GLASS NAVBAR */}
      <header className="sticky top-0 z-50 w-full h-20 glass flex items-center justify-between px-6 md:px-12 select-none">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 shadow-glow flex items-center justify-center font-black">
            B
          </div>
          <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            BrandVox <span className="text-primary-hover">AI</span>
          </span>
        </div>

        {/* Center menu nav links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#models" className="hover:text-white transition-colors">Models</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <span onClick={() => navigate('/explore')} className="hover:text-white transition-colors cursor-pointer">Explore</span>
        </nav>

        {/* Right side checkouts */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/auth')} className="shadow-premium">
            Start Free (50 🪙)
          </Button>
        </div>

        {/* Mobile menu trigger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/70 hover:text-white p-1"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 right-0 bg-surface border-b border-white/5 py-6 px-6 z-50 flex flex-col space-y-4 animate-fade-in glass">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-white/70 text-sm font-bold">Features</a>
          <a href="#models" onClick={() => setMobileMenuOpen(false)} className="text-white/70 text-sm font-bold">Models</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-white/70 text-sm font-bold">Pricing</a>
          <span onClick={() => { setMobileMenuOpen(false); navigate('/explore'); }} className="text-white/70 text-sm font-bold cursor-pointer">Explore</span>
          <div className="flex flex-col space-y-2 pt-4 border-t border-white/5">
            <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>
              Start Free (50 🪙)
            </Button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative px-6 md:px-12 pt-20 pb-28 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Glow backdrop layer */}
        <div className="absolute top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 mb-8 select-none">
          <Sparkles className="w-3.5 h-3.5 text-primary-hover" />
          <span className="text-[10px] font-black uppercase text-primary-hover tracking-widest">
            BrandVox AI Multi-Model Studio
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
          Create Cinematic <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">AI Videos</span> in Seconds
        </h1>

        <p className="text-sm md:text-base text-white/60 font-medium max-w-2xl leading-relaxed mb-10">
          BrandVox AI gives you access to the world's best video generation models — WAN 2.2 and Seedance 2.0 — in one beautiful platform, billed instantly in INR.
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-3.5 sm:space-y-0 sm:space-x-4 mb-14">
          <Button variant="primary" size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto shadow-premium">
            <span>Start Creating Free</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/explore')} className="w-full sm:w-auto">
            <Play className="w-4 h-4 fill-current mr-2" />
            <span>Watch Community Reels</span>
          </Button>
        </div>

        {/* Rating proofs */}
        <div className="flex items-center space-x-2 text-xs font-bold text-white/50 select-none">
          <div className="flex space-x-0.5 text-warning">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span>Join 2,000+ designers rating 5 stars</span>
        </div>
      </section>

      {/* 3. FEATURE CARDS GRID */}
      <section id="features" className="px-6 md:px-12 py-24 bg-surface/30 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
              Powering Next-Gen Creatives
            </h2>
            <p className="text-xs md:text-sm text-white/50 mt-3 leading-relaxed font-medium">
              Equipped with a production-grade multi-model workspace for lightning-speed conceptual rendering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-6 bg-surface border border-white/5 rounded-xl hover-scale flex flex-col items-start space-y-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary-hover">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{feat.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3-step horizontal) */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto select-none">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
            Zero Complexity Workspace
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center font-bold text-primary-hover text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Write Prompt</h3>
            <p className="text-xs text-white/50 font-medium leading-relaxed max-w-xs">
              Describe your dynamic scene, motions, lighting angles, and resolutions.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center font-bold text-primary-hover text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Choose Model</h3>
            <p className="text-xs text-white/50 font-medium leading-relaxed max-w-xs">
              Select between cinematic MiniMax Hailuo, Kling Video, fast Wan 2.5, or Ideogram image models.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center font-bold text-primary-hover text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Render MP4</h3>
            <p className="text-xs text-white/50 font-medium leading-relaxed max-w-xs">
              Preview, download in pristine format, or share instantly with public links!
            </p>
          </div>
        </div>
      </section>

      {/* 5. MODEL SHOWCASE PANEL */}
      <section id="models" className="px-6 md:px-12 py-24 bg-surface/30 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
              AI Models Showcase
            </h2>
            <p className="text-xs md:text-sm text-white/50 mt-3 leading-relaxed font-medium">
              Flexible pay-as-you-go billing in INR. Select the model that matches your aesthetic and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modelsList.map((model, idx) => (
              <div key={idx} className="p-6 bg-surface border border-white/5 rounded-xl hover-scale flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{model.provider}</span>
                    <Badge variant="primary">{model.badge}</Badge>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-3 tracking-wide">{model.name}</h3>
                  <p className="text-xs text-white/50 mt-2.5 leading-relaxed font-medium">{model.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-semibold">
                  <span className="text-white/40 uppercase tracking-wider text-[10px]">Pricing</span>
                  <span className="text-white font-black tracking-wide text-sm">{model.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING GRID (INR Packages) */}
      <section id="pricing" className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
            Straightforward Credit Packages
          </h2>
          <p className="text-xs md:text-sm text-white/50 mt-3 leading-relaxed font-medium">
            UPI, cards, netbanking supported instantly in INR. Signup now to receive 50.00 🪙 welcome credits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {pricingPacks.map((pack) => (
            <div key={pack.id} className="p-6 bg-surface border border-white/5 rounded-xl hover-scale flex flex-col justify-between relative overflow-hidden">
              {pack.bonus && (
                <div className="absolute top-3.5 right-[-35px] bg-primary text-white text-[8px] font-black uppercase py-1 px-10 rotate-45 tracking-widest shadow-premium select-none">
                  {pack.bonus}
                </div>
              )}
              
              <div>
                <h3 className="text-xs font-black uppercase text-white/40 tracking-wider mb-4">{pack.name}</h3>
                <div className="flex items-baseline space-x-1.5 mb-2">
                  <span className="text-2xl font-black text-white">{pack.price}</span>
                </div>
                <p className="text-[10px] text-primary-hover font-extrabold uppercase tracking-widest mb-6">
                  Get {pack.credits} credits
                </p>
                
                <ul className="space-y-3.5 mb-8 text-[11px] font-semibold text-white/60">
                  {pack.features.map((feat, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-3.5 h-3.5 text-success mr-2 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={pack.id === 'creator' ? 'primary' : 'secondary'}
                className="w-full shadow-premium text-xs py-2 font-bold cursor-pointer"
                onClick={() => navigate('/auth')}
              >
                Purchase Pack
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="px-6 md:px-12 py-24 bg-surface/30 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
              Loved by Global Motion Artists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <div key={i} className="p-6 bg-surface border border-white/5 rounded-xl hover-scale flex flex-col justify-between space-y-6">
                <p className="text-xs text-white/65 leading-relaxed font-semibold italic">
                  "{test.text}"
                </p>
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary-hover font-bold text-xs flex items-center justify-center border border-primary/20">
                    {test.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">{test.name}</h4>
                    <p className="text-[9px] text-white/40 uppercase font-black tracking-wider">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PREMIUM FOOTER */}
      <footer className="bg-surface border-t border-white/5 px-6 md:px-12 py-16 text-xs text-white/40 font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-black text-white text-xs">
                B
              </div>
              <span className="text-sm font-extrabold text-white tracking-wider">BrandVox AI</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs text-white/30 font-medium">
              Pristine multi-model AI video and image studio with instant UPI QR & Indian Rupee (INR) pay-as-you-go billing.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><span onClick={() => navigate('/auth')} className="hover:text-white transition-colors cursor-pointer">Multi-Studio</span></li>
              <li><a href="#models" className="hover:text-white transition-colors">AI Models</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Packages</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><span onClick={() => navigate('/explore')} className="hover:text-white transition-colors cursor-pointer">Explore Gallery</span></li>
              <li><span onClick={() => setActiveModal('about')} className="hover:text-white transition-colors cursor-pointer">About BrandVox</span></li>
              <li><span onClick={() => setActiveModal('support')} className="hover:text-white transition-colors cursor-pointer">Support Desk</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px]">
          <span>© 2026 BrandVox AI. All rights reserved.</span>
          <span className="mt-2 md:mt-0 text-white/20 font-medium">Billed in Indian Rupees (INR)</span>
        </div>
      </footer>

      {/* 9. LEGAL & INFO MODAL DIALOG */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[85vh] bg-[#141414] border border-white/10 rounded-2xl p-6 md:p-8 overflow-y-auto shadow-2xl space-y-6">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {activeModal === 'privacy' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Last updated: September 2026. At BrandVox AI, your creative privacy is our highest priority.
                </p>
                <div className="space-y-3 text-xs text-white/70 leading-relaxed">
                  <h4 className="text-sm font-semibold text-white">1. Data Ownership & Storage</h4>
                  <p>All prompts, images, and videos generated via BrandVox AI belong exclusively to you. We do not use your private generations to train artificial intelligence models.</p>
                  
                  <h4 className="text-sm font-semibold text-white">2. Ephemeral Processing</h4>
                  <p>Media inputs uploaded for Image-to-Video generation are stored in secure, private encrypted cloud storage and are accessible only by your authenticated profile.</p>

                  <h4 className="text-sm font-semibold text-white">3. Payment Information</h4>
                  <p>We do not store credit card or banking credentials. Payments are made through manual UPI transfers where transaction verification is done via 12-digit UTR reference numbers.</p>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  By using BrandVox AI, you agree to adhere to our content and generation policies.
                </p>
                <div className="space-y-3 text-xs text-white/70 leading-relaxed">
                  <h4 className="text-sm font-semibold text-white">1. Acceptable Use Policy</h4>
                  <p>You agree not to generate illegal, defamatory, sexually explicit, abusive, or copyright-infringing content. Violations result in immediate account suspension without refund.</p>

                  <h4 className="text-sm font-semibold text-white">2. Credits & Refunds</h4>
                  <p>Credits purchased via UPI packages are added to your account upon verification. If an AI generation fails due to a server error, the exact credit cost is automatically refunded to your balance.</p>

                  <h4 className="text-sm font-semibold text-white">3. Commercial Rights</h4>
                  <p>You own full commercial exploitation rights to all videos and images synthesized by your account using paid credits.</p>
                </div>
              </div>
            )}

            {activeModal === 'about' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">About BrandVox AI</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  BrandVox AI is an Indian AI-native video and image generation platform designed to eliminate high recurring USD subscription barriers.
                </p>
                <p className="text-xs text-white/70 leading-relaxed">
                  By offering transparent INR pay-as-you-go billing with instant UPI checkouts, creators, marketers, and video agencies can synthesize cinematic reels, motion ads, and visual artwork using state-of-the-art diffusion engines like MiniMax Hailuo, Kling Video, Wan 2.5, and Ideogram.
                </p>
              </div>
            )}

            {activeModal === 'support' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Support Desk</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Need assistance with your generations, UPI verification, or custom agency requirements?
                </p>
                <div className="p-4 bg-white/5 border border-white/8 rounded-xl space-y-2 text-xs">
                  <p className="text-white/60">Email Support:</p>
                  <p className="text-primary-hover font-bold text-sm">support@brandvox.ai</p>
                  <p className="text-[11px] text-white/40 pt-1">Typical response time: Under 12 hours (Monday to Saturday).</p>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  For payment verification queries, please keep your 12-digit bank UTR reference number and registered email address handy.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
