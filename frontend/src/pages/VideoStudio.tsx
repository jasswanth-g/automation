import { useState, useEffect } from 'react';
import { getVideos, deleteVideo } from '../api/video';
import type { VideoStatus } from '../types';
import VideoGenerator from '../components/VideoGenerator';
import { Loader2, Plus, RefreshCw, Trash2, Video as VideoIcon, ExternalLink, Play } from 'lucide-react';
import './VideoStudio.css';

const VideoStudio = () => {
  const [videos, setVideos] = useState<VideoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activePlayingVideo, setActivePlayingVideo] = useState<VideoStatus | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await getVideos();
      setVideos(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch video library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this generated video?')) {
      try {
        await deleteVideo(id);
        setVideos(videos.filter(v => v.id !== id));
      } catch (err) {
        alert('Failed to delete video.');
      }
    }
  };

  const handleGeneratorSuccess = () => {
    fetchVideos();
  };

  return (
    <div className="video-studio-page">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Video Studio</h1>
            <p className="subtitle">Upload custom images, write text, select music, and generate videos directly.</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchVideos} className="btn btn-outline icon-only" title="Refresh Videos">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setIsGeneratorOpen(true)} className="btn btn-primary">
              <Plus size={20} />
              <span>Create Custom Video</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="form-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {loading && videos.length === 0 ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={48} />
          <p>Loading video library...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state card">
          <VideoIcon size={64} className="text-muted mb-4" />
          <h3>No Generated Videos Yet</h3>
          <p className="text-muted mb-6">Click below to upload an image, add text, select music, and generate your first video!</p>
          <button onClick={() => setIsGeneratorOpen(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Custom Video</span>
          </button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(video => (
            <div key={video.id} className="video-card card">
              <div className="video-thumb-container">
                {video.status === 'completed' && video.url ? (
                  <div className="video-player-wrapper" onClick={() => setActivePlayingVideo(video)}>
                    <video src={video.url} preload="metadata" />
                    <div className="play-overlay">
                      <div className="play-button">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="video-placeholder flex items-center justify-center">
                    {video.status === 'processing' || video.status === 'pending' ? (
                      <div className="text-center p-4">
                        <Loader2 className="animate-spin mx-auto text-primary mb-2" size={32} />
                        <span className="text-xs text-muted">Processing Video...</span>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-red-500">
                        <span className="text-xs">Generation Failed</span>
                      </div>
                    )}
                  </div>
                )}
                <span className={`status-badge status-${video.status}`}>
                  {video.status}
                </span>
              </div>

              <div className="video-card-body">
                <div className="video-meta">
                  <span className="video-date">
                    {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                
                <div className="video-card-actions">
                  {video.url && (
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-outline btn-xs"
                      title="Open Video URL"
                    >
                      <ExternalLink size={14} />
                      <span>Open</span>
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(video.id)} 
                    className="btn btn-danger btn-xs icon-only" 
                    title="Delete Video"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generator Modal */}
      {isGeneratorOpen && (
        <VideoGenerator
          onClose={() => setIsGeneratorOpen(false)}
          onSuccess={handleGeneratorSuccess}
        />
      )}

      {/* Playing Video Modal */}
      {activePlayingVideo && (
        <div className="modal-overlay" onClick={() => setActivePlayingVideo(null)}>
          <div className="modal-content card text-center p-6" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="video-preview-container mb-4" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '9/16' }}>
              <video 
                src={activePlayingVideo.url} 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '500px', display: 'block' }} 
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActivePlayingVideo(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStudio;
