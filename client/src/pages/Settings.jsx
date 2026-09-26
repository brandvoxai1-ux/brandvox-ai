// client/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Topbar from '../components/layout/Topbar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { User, Shield, Bell, Eye, EyeOff, Lock, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  
  // Tabs: 'profile' | 'security' | 'notifications' | 'privacy'
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile details if loaded asynchronously in background
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Security password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Notification configurations states
  const [notifComplete, setNotifComplete] = useState(true);
  const [notifPurchase, setNotifPurchase] = useState(true);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Profile details modified.');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords mismatch.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success('Account password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Change password failed.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Deleting your account will permanently erase your credits and generated videos. This cannot be undone! Are you sure?')) {
      try {
        toast.loading('Deleting account...');
        const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
        if (error) throw error;
        await supabase.auth.signOut();
        toast.dismiss();
        toast.success('Account erased completely.');
      } catch (err) {
        toast.dismiss();
        toast.error('Deletion request interrupted. Contact support.');
      }
    }
  };

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      {/* Top navigation header */}
      <Topbar title="My Settings" />

      {/* Main Settings Panel */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8 select-none">
        
        {/* Left Side Tab Navigation Drawer */}
        <aside className="w-full md:w-48 shrink-0 flex flex-col space-y-1.5 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'security' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'notifications' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'privacy' ? 'bg-primary text-white shadow-glow' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy & Deletion</span>
          </button>
        </aside>

        {/* Right Side Settings detail views */}
        <section className="flex-grow max-w-xl bg-surface border border-white/5 rounded-2xl p-6 shadow-premium h-fit">
          
          {/* PROFILE DETAILS TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">
                Profile Specifications
              </h3>
              
              <div className="flex items-center space-x-4 pb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center border border-white/10 select-none shadow-glow">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{profile?.full_name || 'BrandVox User'}</h4>
                  <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider mt-0.5">{profile?.role}</p>
                </div>
              </div>

              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Email Address</label>
                <div className="bg-surface-elevated text-white/40 border border-white/5 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
                  <span>{profile?.email}</span>
                  <Mail className="w-4 h-4 text-white/20" />
                </div>
                <span className="text-[10px] text-white/30 font-semibold italic">Contact support desk to alter account email</span>
              </div>

              <Button type="submit" isLoading={savingProfile} className="w-full shadow-premium text-xs py-2.5 font-bold uppercase">
                Save Modifications
              </Button>
            </form>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">
                Password Security Controls
              </h3>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" isLoading={changingPass} className="w-full shadow-premium text-xs py-2.5 font-bold uppercase">
                Update Account Password
              </Button>
            </form>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">
                Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-surface-elevated px-4 py-3.5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">Video Compilation Alerts</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">Receive browser alerts upon complete compiles</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifComplete}
                    onChange={(e) => setNotifComplete(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary rounded bg-surface border-white/10"
                  />
                </div>

                <div className="flex items-center justify-between bg-surface-elevated px-4 py-3.5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white">UPI Payment Confirmations</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">Receive confirmations for credit package top-ups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPurchase}
                    onChange={(e) => setNotifPurchase(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary rounded bg-surface border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & ACCOUNT DELETION */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">
                Account Erasure Panel
              </h3>
              
              <div className="bg-red-950/20 border border-error/25 p-4 rounded-xl space-y-3.5">
                <p className="text-xs text-white/70 leading-relaxed font-semibold">
                  Erase your BrandVox account permanently. All generated Mp4 assets, logs, billing profiles, and active INR credits will be deleted immediately.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center space-x-2 bg-error hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-premium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete BrandVox Account</span>
                </button>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
