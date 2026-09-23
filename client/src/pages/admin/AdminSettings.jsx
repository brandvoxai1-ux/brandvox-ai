// client/src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings, Save, ShieldAlert, Cpu, ToggleLeft, ToggleRight, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [platformName, setPlatformName] = useState('BrandVox AI');
  const [welcomeCredits, setWelcomeCredits] = useState(50.00);
  const [maxFreeGens, setMaxFreeGens] = useState(5);
  const [targetProfitMargin, setTargetProfitMargin] = useState(60);
  
  // Toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);

  // Status API states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const s = res.data || {};
      setPlatformName(s.platformName || 'BrandVox AI');
      setWelcomeCredits(parseFloat(s.welcomeCredits || 50));
      setMaxFreeGens(parseInt(s.maxFreeGenerationsPerDay || 5));
      setTargetProfitMargin(parseFloat(s.targetProfitMargin || 60));
      setMaintenanceMode(!!s.maintenanceMode);
      setAllowSignups(!!s.allowSignups);
    } catch (err) {
      toast.error('Failed to retrieve server platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        platformName,
        welcomeCredits: parseFloat(welcomeCredits),
        maxFreeGenerationsPerDay: parseInt(maxFreeGens),
        targetProfitMargin: parseFloat(targetProfitMargin),
        maintenanceMode,
        allowSignups
      };
      await api.patch('/admin/settings', payload);
      toast.success('Platform configurations updated.');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-xl">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Platform Specifications</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Global onboarding bonuses, profit margin targets, and maintenance banners
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl p-6 space-y-6 shadow-premium">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center border-b border-purple-500/5 pb-3">
          <Settings className="w-4.5 h-4.5 mr-1.5 text-purple-400" />
          <span>General Config Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Platform Display Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            required
          />
          <Input
            label="Welcome Signup Credits (🪙)"
            type="number"
            value={welcomeCredits}
            onChange={(e) => setWelcomeCredits(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Max Free Gens / Day"
            type="number"
            value={maxFreeGens}
            onChange={(e) => setMaxFreeGens(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <Input
              label="Target Profit Margin (%)"
              type="number"
              min="10"
              max="95"
              value={targetProfitMargin}
              onChange={(e) => setTargetProfitMargin(e.target.value)}
              required
            />
            <p className="text-[9.5px] text-purple-300/50 font-semibold">
              Client target profit markup over Replicate costs (e.g. 60% = ~2.5x markup)
            </p>
          </div>
        </div>


        {/* Dynamic toggles */}
        <div className="space-y-4 pt-2 border-t border-purple-500/5 select-none">
          
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between bg-[#130E26]/50 p-4 rounded-xl border border-purple-500/5">
            <div>
              <h4 className="text-xs font-bold text-white">Emergency Maintenance Mode</h4>
              <p className="text-[10px] text-purple-300/40 mt-0.5">Toggle site maintenance banner overlay for guests</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className="text-purple-400 hover:text-white cursor-pointer"
            >
              {maintenanceMode ? <ToggleRight className="w-7 h-7 text-error" /> : <ToggleLeft className="w-7 h-7 text-white/20" />}
            </button>
          </div>

          {/* Allow public signups */}
          <div className="flex items-center justify-between bg-[#130E26]/50 p-4 rounded-xl border border-purple-500/5">
            <div>
              <h4 className="text-xs font-bold text-white">Allow Public Registration</h4>
              <p className="text-[10px] text-purple-300/40 mt-0.5">Enable or disable immediate signups</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowSignups(!allowSignups)}
              className="text-purple-400 hover:text-white cursor-pointer"
            >
              {allowSignups ? <ToggleRight className="w-7 h-7 text-success" /> : <ToggleLeft className="w-7 h-7 text-white/20" />}
            </button>
          </div>

        </div>

        {/* Connected API checks */}
        <div className="space-y-3 pt-4 border-t border-purple-500/5 select-none">
          <label className="text-[10px] font-bold text-purple-300/40 uppercase tracking-widest block">API Channels Check</label>
          <div className="grid grid-cols-2 gap-4 text-[10.5px]">
            <div className="bg-[#130E26] px-3.5 py-2.5 rounded-lg flex items-center justify-between border border-purple-500/5">
              <span className="font-semibold text-white/60">Replicate AI Integration</span>
              <div className="flex items-center space-x-1 text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-extrabold uppercase text-[9px] tracking-wider">Ready</span>
              </div>
            </div>

            <div className="bg-[#130E26] px-3.5 py-2.5 rounded-lg flex items-center justify-between border border-purple-500/5">
              <span className="font-semibold text-white/60">Cashfree payments</span>
              <div className="flex items-center space-x-1 text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-extrabold uppercase text-[9px] tracking-wider">Active</span>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" isLoading={saving} icon={Save} className="w-full uppercase font-bold text-xs py-3 shadow-premium mt-4">
          Save Specifications
        </Button>
      </form>

    </div>
  );
}
