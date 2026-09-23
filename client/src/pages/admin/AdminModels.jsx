// client/src/pages/admin/AdminModels.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Database, Plus, Edit2, Trash2, Cpu, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeModelId, setActiveModelId] = useState(null);

  // Form parameters
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [falEndpoint, setFalEndpoint] = useState('');
  const [description, setDescription] = useState('');
  const [modelType, setModelType] = useState('video');
  const [baseCost, setBaseCost] = useState('0');
  const [pricePerSecond, setPricePerSecond] = useState('');
  const [maxDuration, setMaxDuration] = useState(15);
  const [supportsAudio, setSupportsAudio] = useState(true);
  const [supportsImage, setSupportsImage] = useState(false);
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper to determine estimated Replicate GPU costs in INR
  const getEstimatedProviderCost = (endpoint = '', type = 'video') => {
    const ep = (endpoint || '').toLowerCase();
    if (type === 'image' || ep.includes('ideogram') || ep.includes('flux')) {
      return 0.70; // ~₹0.70 / image
    }
    if (ep.includes('minimax') || ep.includes('hailuo')) {
      return 7.25; // ~₹7.25 / sec ($0.52 for 6s = ₹43.50)
    }
    if (ep.includes('kling')) {
      return 3.50; // ~₹3.50 / sec
    }
    if (ep.includes('wan')) {
      return 1.00; // ~₹1.00 / sec
    }
    return 0.75; // standard fast video model
  };

  // Calculate live margin metrics
  const activeCost = getEstimatedProviderCost(falEndpoint, modelType);
  const currentSellingPrice = parseFloat(modelType === 'image' ? (baseCost || 0) : (pricePerSecond || 0));
  const currentNetProfit = Math.max(0, currentSellingPrice - activeCost);
  const currentMarginPercent = currentSellingPrice > 0 
    ? Math.round(((currentSellingPrice - activeCost) / currentSellingPrice) * 100) 
    : 0;

  const applyMarginPreset = (targetMarginPercent) => {
    if (targetMarginPercent >= 100) {
      // 2x or 3x markup
      const multiplier = targetMarginPercent === 100 ? 2 : 3;
      const targetPrice = (activeCost * multiplier).toFixed(2);
      if (modelType === 'image') setBaseCost(targetPrice);
      else setPricePerSecond(targetPrice);
    } else {
      const targetPrice = (activeCost / (1 - targetMarginPercent / 100)).toFixed(2);
      if (modelType === 'image') setBaseCost(targetPrice);
      else setPricePerSecond(targetPrice);
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/models');
      setModels(res.data || []);
    } catch (err) {
      toast.error('Failed to sync AI models index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setActiveModelId(null);
    setModelId('');
    setName('');
    setProvider('');
    setFalEndpoint('');
    setDescription('');
    setModelType('video');
    setBaseCost('0');
    setPricePerSecond('');
    setMaxDuration(15);
    setSupportsAudio(true);
    setSupportsImage(false);
    setBadge('');
    setIsActive(true);
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (model) => {
    setEditMode(true);
    setActiveModelId(model.id);
    setModelId(model.id);
    setName(model.name);
    setProvider(model.provider);
    setFalEndpoint(model.fal_endpoint);
    setDescription(model.description || '');
    setModelType(model.model_type || 'video');
    setBaseCost(model.base_cost || 0);
    setPricePerSecond(model.price_per_second || 0);
    setMaxDuration(model.max_duration || 15);
    setSupportsAudio(model.supports_audio);
    setSupportsImage(model.supports_image_input);
    setBadge(model.badge || '');
    setIsActive(model.is_active);
    setIsFeatured(model.is_featured);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelId || !name || !provider || !falEndpoint) {
      toast.error('Please enter all required specifications.');
      return;
    }

    setSubmitting(true);
    const payload = {
      id: modelId,
      name,
      provider,
      fal_endpoint: falEndpoint,
      description,
      model_type: modelType,
      base_cost: parseFloat(baseCost || 0),
      price_per_second: parseFloat(pricePerSecond || 0),
      max_duration: parseInt(maxDuration || 15),
      supports_audio: supportsAudio,
      supports_image_input: supportsImage,
      badge,
      is_active: isActive,
      is_featured: isFeatured
    };

    try {
      if (editMode) {
        await api.patch(`/admin/models/${activeModelId}`, payload);
        toast.success('AI Model configurations saved.');
      } else {
        await api.post('/admin/models', payload);
        toast.success('AI Model added to active listings successfully.');
      }
      setModalOpen(false);
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit model configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleState = async (model, field) => {
    const updatedValue = !model[field];
    try {
      await api.patch(`/admin/models/${model.id}`, { [field]: updatedValue });
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, [field]: updatedValue } : m));
      toast.success('Status updated.');
    } catch (err) {
      toast.error('Failed to change configuration status.');
    }
  };

  const handleSoftDelete = async (modelId) => {
    if (window.confirm('Mark this AI model configuration as inactive (soft delete)? It will disappear from client pickers.')) {
      try {
        await api.delete(`/admin/models/${modelId}`);
        toast.success('Model flagged as inactive successfully.');
        fetchModels();
      } catch (err) {
        toast.error('Failed to remove model.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">AI Models Configurations</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Register and seed Replicate model endpoints immediately into the Studio picker
          </p>
        </div>
        
        <div className="flex space-x-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchModels}
            className="p-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openAddModal}
            className="shadow-premium uppercase font-extrabold text-[10px] py-2"
          >
            Add New AI Model
          </Button>
        </div>
      </div>

      {/* Models catalog list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider">
          No AI video models configured yet. Tap Add Model.
        </div>
      ) : (
        <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                  <th className="p-4">Model Name</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Est. GPU Cost</th>
                  <th className="p-4">Margin Ratio</th>
                  <th className="p-4 text-center">Active</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-white/80 divide-y divide-purple-500/5">
                {models.map((m) => {
                  const unitCost = getEstimatedProviderCost(m.fal_endpoint, m.model_type);
                  const sellingVal = parseFloat(m.model_type === 'image' ? (m.base_cost || 0) : (m.price_per_second || 0));
                  const marginPct = sellingVal > 0 ? Math.round(((sellingVal - unitCost) / sellingVal) * 100) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 rounded bg-purple-600/10 text-purple-400">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{m.name}</span>
                            {m.badge && <span className="text-[8px] text-primary-hover font-black uppercase">{m.badge}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-purple-300/60 uppercase tracking-wide">{m.provider}</td>
                      <td className="p-4 text-warning font-black">
                        {m.model_type === 'image' ? `₹${sellingVal.toFixed(2)} / img` : `₹${sellingVal.toFixed(2)} / s`}
                      </td>
                      <td className="p-4 text-white/40 font-mono text-[11px]">
                        ₹{unitCost.toFixed(2)} / {m.model_type === 'image' ? 'img' : 's'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          marginPct >= 50
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : marginPct >= 20
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`} Margin
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleState(m, 'is_active')}
                          className="flex items-center justify-center mx-auto text-purple-400 hover:text-white transition-all cursor-pointer"
                        >
                          {m.is_active ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6 text-white/20" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleState(m, 'is_featured')}
                          className="flex items-center justify-center mx-auto text-purple-400 hover:text-white transition-all cursor-pointer"
                        >
                          {m.is_featured ? <ToggleRight className="w-6 h-6 text-primary-hover" /> : <ToggleLeft className="w-6 h-6 text-white/20" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Edit details */}
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                            title="Modify Model"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {/* Soft delete */}
                          <button
                            onClick={() => handleSoftDelete(m.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
                            title="Soft delete model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD AI MODEL MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit AI Video Model Configurations' : 'Register New AI Video Model'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model ID"
              placeholder="e.g. wan-2-2"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={editMode}
              required
            />
            <Input
              label="Display Name"
              placeholder="e.g. WAN 2.2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Provider Name"
              placeholder="e.g. Alibaba"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
            />
            <div>
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block mb-1">Model Type</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-[#130E26] border border-purple-500/20 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="video">Video Model</option>
                <option value="image">Image Model</option>
              </select>
            </div>
            <Input
              label={modelType === 'image' ? "Base Flat Cost (INR)" : "Price per Sec (INR)"}
              type="number"
              step="0.01"
              placeholder="e.g. 8.00"
              value={modelType === 'image' ? baseCost : pricePerSecond}
              onChange={(e) => modelType === 'image' ? setBaseCost(e.target.value) : setPricePerSecond(e.target.value)}
              required
            />
          </div>

          {/* Interactive Profit Margin & Markup Engine */}
          <div className="bg-[#181133] border border-purple-500/20 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                💰 Margin & Profit Ratio Engine
              </span>
              <span className="text-[10px] text-white/50">
                GPU Cost: <strong className="text-white">₹{activeCost.toFixed(2)}</strong> / {modelType === 'image' ? 'img' : 's'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-white/40 font-semibold mr-1">Quick Target:</span>
              {[
                { label: '35% Margin', pct: 35 },
                { label: '50% Margin', pct: 50 },
                { label: '65% Margin', pct: 65 },
                { label: '100% (2x)', pct: 100 },
                { label: '150% (2.5x)', pct: 150 }
              ].map(({ label, pct }) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyMarginPreset(pct)}
                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 hover:text-white border border-purple-500/20 transition-all cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-purple-500/10 text-[11px]">
              <span className="text-white/60">Estimated Net Profit:</span>
              <div className="flex items-center gap-2">
                <span className="text-success font-black">
                  +₹{currentNetProfit.toFixed(2)} / {modelType === 'image' ? 'img' : 's'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  currentMarginPercent >= 50 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : currentMarginPercent >= 20
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {currentMarginPercent}% Margin
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Replicate / Model Endpoint String"
            placeholder="e.g. prunaai/p-image-ideogram or minimax/video-01"
            value={falEndpoint}
            onChange={(e) => setFalEndpoint(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Key model highlights..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Duration (Sec)"
              type="number"
              placeholder="e.g. 15"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseInt(e.target.value))}
            />
            <Input
              label="Display Badge Text"
              placeholder="e.g. Budget / Quality"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </div>

          {/* Toggle buttons grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#130E26]/50 p-3 rounded-xl border border-purple-500/5 select-none">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <span>Supports Audio</span>
              <input
                type="checkbox"
                checked={supportsAudio}
                onChange={(e) => setSupportsAudio(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <span>Animate Image (I2V)</span>
              <input
                type="checkbox"
                checked={supportsImage}
                onChange={(e) => setSupportsImage(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </div>
          </div>

          <Button type="submit" isLoading={submitting} className="w-full uppercase font-bold text-xs py-2.5 shadow-premium">
            {editMode ? 'Update Model Config' : 'Register AI Model'}
          </Button>
        </form>
      </Modal>

    </div>
  );
}
