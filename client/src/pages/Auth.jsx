// client/src/pages/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Film, Eye, EyeOff, Sparkles, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const { login, signUp, sendPasswordReset, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode states: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if session is already active
  useEffect(() => {
    if (user) {
      navigate('/explore');
    }
  }, [user, navigate]);

  // Adjust reset query
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      toast.success('Reset email sent successfully! Please set your new password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Please fill in all email and password fields.');
        }
        await login(email, password);
        toast.success('Welcome back to BrandVox AI!');
        navigate('/explore');
      } else if (mode === 'signup') {
        if (!email || !password || !fullName) {
          throw new Error('All signup fields are required.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (!agreeTerms) {
          throw new Error('You must agree to the Terms and Privacy Policy to continue.');
        }
        await signUp(email, password, fullName);
        toast.success('Registration complete! Welcome to BrandVox AI (50 🪙 credited).');
        navigate('/explore');
      } else if (mode === 'forgot') {
        if (!email) {
          throw new Error('Please enter your email address to receive a reset link.');
        }
        await sendPasswordReset(email);
        toast.success('Reset link dispatched! Check your email inbox.');
        setMode('login');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-darkBg text-white animated-gradient flex items-center justify-center p-4">
      {/* Dynamic Background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      {/* Main Glassmorphic Panel */}
      <div className="w-full max-w-md glass-premium rounded-2xl p-8 hover-scale relative overflow-hidden">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 shadow-glow cursor-pointer mb-3"
          >
            <Film className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            BrandVox <span className="text-primary-hover">AI</span>
          </h2>
          <p className="text-xs text-white/40 mt-1 font-semibold tracking-wide uppercase">
            Multi-Model AI Video Generator
          </p>
        </div>

        {/* Tab Toggle Switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-surface-elevated p-1 rounded-lg border border-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-md tracking-wider transition-all duration-200 ${
                mode === 'login' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-md tracking-wider transition-all duration-200 ${
                mode === 'signup' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="inline-flex items-center text-xs font-bold text-white/50 hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
          )}

          {mode === 'signup' && (
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Aarav Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode !== 'forgot' && (
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[34px] text-white/30 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {/* Action checkboxes / Forgot details */}
          {mode === 'login' && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs font-bold text-primary-hover hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex items-start space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="agree"
                name="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 accent-primary rounded bg-surface border-white/10"
              />
              <label htmlFor="agree" className="text-xs text-white/50 leading-relaxed font-semibold">
                I agree to the{' '}
                <span className="text-white hover:underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-white hover:underline cursor-pointer">Privacy Policy</span>.
              </label>
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full shadow-premium tracking-wider mt-2 py-3 font-extrabold uppercase text-xs">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>



        {/* Bottom helper mode switchers */}
        <div className="text-center mt-6 text-xs text-white/40 font-semibold">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-primary-hover hover:underline cursor-pointer font-bold">
                Sign Up
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-primary-hover hover:underline cursor-pointer font-bold">
                Sign In
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
