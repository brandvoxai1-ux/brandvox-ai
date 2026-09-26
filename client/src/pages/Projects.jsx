// client/src/pages/Projects.jsx
import React, { useState, useEffect } from 'react';
import { useGeneration } from '../hooks/useGeneration';
import { useAuth } from '../hooks/useAuth';
import VideoCard from '../components/shared/VideoCard';
import MediaModal from '../components/shared/MediaModal';
import Topbar from '../components/layout/Topbar';
import { Grid, List, Search, SlidersHorizontal, Film, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { formatDate, formatCredits } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Projects() {
  const { profile } = useAuth();
  const {
    fetchGenerations,
    deleteGeneration,
    updateGeneration
  } = useGeneration();

  const [videos, setVideos] = useState([]);
  const [watermarkRequired, setWatermarkRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // Controls
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'processing' | 'failed'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'video' | 'swap' | 'image'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadVideos = async (page = 1, append = false) => {
    if (!profile?.id) return;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetchGenerations(page, 12);
      if (res) {
        setVideos(prev => append ? [...prev, ...(res.generations || [])] : (res.generations || []));
        setWatermarkRequired(res.watermarkRequired);
        setTotalPages(res.pagination?.pages || 1);
        setCurrentPage(page);
      }
    } catch (err) {
      toast.error('Failed to sync video libraries.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadVideos(1, false);
  }, [profile?.id]);

  // Auto-refresh library when any generation is currently processing or pending
  useEffect(() => {
    const hasActiveJobs = videos.some(v => v.status === 'processing' || v.status === 'pending');
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadVideos(currentPage, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [videos, currentPage]);

  // Client side filters
  const filteredVideos = videos
    .filter((v) => {
      const matchesSearch = v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'image' ? v.generation_type === 'image' : 
         typeFilter === 'swap' ? v.generation_type === 'swap' : 
         (v.generation_type !== 'image' && v.generation_type !== 'swap'));
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      loadVideos(currentPage + 1, true);
    }
  };

  const handleTitleRename = async (id, newTitle) => {
    try {
      await updateGeneration(id, { title: newTitle });
      setVideos(prev => prev.map(v => v.id === id ? { ...v, title: newTitle } : v));
      toast.success('Video title modified.');
    } catch (err) {
      toast.error('Rename failed.');
    }
  };

  const handleVideoDelete = async (id) => {
    try {
      await deleteGeneration(id);
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const handleShareState = async (id, shareState) => {
    try {
      await updateGeneration(id, { is_public: shareState });
      setVideos(prev => prev.map(v => v.id === id ? { ...v, is_public: shareState } : v));
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      {/* Top navbar controls */}
      <Topbar title="My Creations" />

      {/* Main panel scroll container */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Filters and Lookups Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-white/5 p-4 rounded-xl select-none">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search creation name or prompt keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-elevated text-xs rounded-lg px-9 py-2.5 border border-white/10 w-full focus:outline-none focus:border-primary text-white/80"
            />
          </div>

          {/* Configuration tools */}
          <div className="flex items-center space-x-3.5">
            {/* Status filters */}
            <div className="flex items-center space-x-1.5 text-xs text-white/50">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-elevated text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Creation Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-surface-elevated text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="swap">Character Swaps</option>
              <option value="image">Images</option>
            </select>

            {/* Sort sorting tool */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-elevated text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Layout layout toggles */}
            <div className="flex bg-surface-elevated p-1 rounded-lg border border-white/5 space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-white/40'}`}
                title="Grid visual"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-primary text-white' : 'text-white/40'}`}
                title="Table log list"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Catalog Layouts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-white/35 font-bold tracking-widest uppercase">Syncing libraries...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center p-12 bg-surface border border-white/5 rounded-2xl text-center space-y-4 max-w-xl mx-auto mt-10">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-full text-primary">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">No creations found</h3>
            <p className="text-xs text-white/50 max-w-xs leading-relaxed font-semibold">
              You haven't generated any creations matching your select criteria. Go to the Studio to begin.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  watermarkRequired={watermarkRequired}
                  onPlay={(vid) => setSelectedMedia(vid)}
                  onDelete={handleVideoDelete}
                  onToggleShare={handleShareState}
                  onRename={handleTitleRename}
                />
              ))}
            </div>

            {/* Pagination Load More trigger */}
            {currentPage < totalPages && (
              <div className="flex justify-center select-none pt-4">
                <Button variant="secondary" onClick={handleLoadMore} isLoading={loadingMore} className="font-bold text-xs py-2">
                  Load More Creations
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* List View Mode (Premium table list) */
          <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-premium select-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase font-black tracking-wider text-[10px] bg-surface-elevated/40">
                    <th className="p-4">Thumbnail</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">AI Model</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-white/80 divide-y divide-white/5">
                  {filteredVideos.map((video) => (
                    <tr
                      key={video.id}
                      onClick={() => video.status === 'completed' && setSelectedMedia(video)}
                      className={`transition-colors ${video.status === 'completed' ? 'hover:bg-white/5 cursor-pointer' : ''}`}
                    >
                      <td className="p-4">
                        <div className="w-16 aspect-video bg-black rounded-lg overflow-hidden border border-white/5 relative">
                          <Play className="w-3.5 h-3.5 text-white/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="truncate max-w-[200px]" title={video.title}>{video.title}</div>
                      </td>
                      <td className="p-4">{video.model_name}</td>
                      <td className="p-4">
                        <Badge variant={video.status === 'completed' ? 'success' : video.status === 'failed' ? 'error' : 'warning'}>
                          {video.status}
                        </Badge>
                      </td>
                      <td className="p-4">{video.duration}s</td>
                      <td className="p-4 text-warning">{formatCredits(video.cost || 0)}</td>
                      <td className="p-4 text-white/40">{formatDate(video.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Full-view playback & media modal */}
      <MediaModal
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        media={selectedMedia}
        watermarkRequired={watermarkRequired}
      />
    </div>
  );
}
