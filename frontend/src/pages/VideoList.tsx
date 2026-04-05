import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideos, deleteVideo } from '../api/video';
import type { VideoStatus } from '../types';
import { Loader2, Video, Trash2, AlertCircle, Clock, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import './VideoList.css';

const VideoList = () => {
  const [videos, setVideos] = useState<VideoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await getVideos();
      setVideos(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id);
        setVideos(videos.filter(v => v.id !== id));
      } catch (err) {
        alert('Failed to delete video.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-success" size={18} />;
      case 'failed': return <AlertCircle className="text-danger" size={18} />;
      case 'processing': return <Loader2 className="animate-spin text-primary" size={18} />;
      default: return <Clock className="text-muted" size={18} />;
    }
  };

  if (loading && videos.length === 0) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="video-list-page">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Generated Videos</h1>
            <p className="subtitle">View and manage your quote-based videos.</p>
          </div>
          <button onClick={() => navigate('/quotes')} className="btn btn-primary">
            <Plus size={20} />
            <span>Generate New</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchVideos} className="btn btn-primary">Try Again</button>
        </div>
      )}

      {videos.length === 0 && !loading ? (
        <div className="empty-state">
          <Video size={64} />
          <h3>No videos found</h3>
          <p>You haven't generated any videos yet. Go to the Quotes section to start.</p>
          <button onClick={() => navigate('/quotes')} className="btn btn-primary">
            <Plus size={20} />
            <span>Generate your first video</span>
          </button>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-card card">
              <div className="video-card-header">
                <div className="video-status-info">
                  {getStatusIcon(video.status)}
                  <span className={`status-text capitalize ${video.status}`}>{video.status}</span>
                </div>
                <button onClick={() => handleDelete(video.id)} className="icon-btn danger" title="Delete Video">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="video-card-body">
                {video.status === 'completed' ? (
                  <div className="video-player-container">
                    <video 
                      src={video.url} 
                      className="video-player"
                      poster="/video-placeholder.png"
                      controls
                    />
                  </div>
                ) : video.status === 'failed' ? (
                  <div className="video-error-container">
                    <AlertCircle size={32} className="text-danger mb-2" />
                    <p className="error-msg">{video.error || 'Generation failed'}</p>
                  </div>
                ) : (
                  <div className="video-processing-container">
                    <Loader2 size={32} className="animate-spin text-primary mb-2" />
                    <p>Processing video...</p>
                  </div>
                )}
              </div>

              <div className="video-card-footer">
                <div className="video-meta">
                  <span className="timestamp">Created: {new Date(video.created_at).toLocaleDateString()}</span>
                </div>
                {video.url && (
                  <div className="video-actions">
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="icon-link" title="Open Original">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
