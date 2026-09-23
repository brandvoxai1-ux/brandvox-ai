// client/src/pages/Explore.jsx
import React, { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import VideoCard from '../components/shared/VideoCard';
import { supabase } from '../lib/supabase';
import { useModels } from '../hooks/useModels';
import { Search, Compass, Cpu, Film, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Explore() {
  const { models } = useModels();
  const [publicVideos, setPublicVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');

  const fetchPublicVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicVideos(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load community gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicVideos();
  }, []);

  const filteredReels = publicVideos.filter((video) => {
    const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = selectedModel === 'all' || video.model_id === selectedModel;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      {/* Top Header bar */}
      <Topbar title="Explore Gallery" />

      {/* Main catalog panel */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Header Title block */}
        <div className="flex items-center space-x-3.5 select-none">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary-hover border border-primary/10">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide">Community Creations</h2>
            <p className="text-[10.5px] text-white/40 font-semibold uppercase tracking-wider">
              Explore public videos compiled by BrandVox designers worldwide
            </p>
          </div>
        </div>

        {/* Dynamic Filters panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-white/5 p-4 rounded-xl select-none">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search public prompts or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-elevated text-xs rounded-lg px-9 py-2.5 border border-white/10 w-full focus:outline-none focus:border-primary text-white/80"
            />
          </div>

          {/* Model filters */}
          <div className="flex items-center space-x-2 text-xs text-white/50">
            <Cpu className="w-4 h-4 text-white/40" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-surface-elevated text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All Models</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Public creations masonry grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-white/30 font-bold tracking-wider uppercase">Loading community gallery...</p>
          </div>
        ) : filteredReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface border border-white/5 rounded-2xl text-center space-y-4 max-w-xl mx-auto mt-10">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-full text-primary">
              <Film className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">No public reels</h3>
            <p className="text-xs text-white/50 max-w-xs leading-relaxed font-semibold">
              Be the first! Share your generated videos to public gallery from projects panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReels.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                watermarkRequired={false} // Explore displays only public completed items, which are watermark-free or pre-compiled. In this design, community videos render watermark-free.
                showActions={false} // Guest viewing removes modifications
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
