import { useState, useEffect } from 'react';
import { getVideos, deleteVideo } from '../api/video';
import type { VideoStatus } from '../types';
import { Loader2, Video, Trash2, Play, ExternalLink, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import './VideoList.css';

const VideoList = () => {
  const [videos, setVideos] = useState<VideoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoStatus | null>(null);

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
        if (activeVideo?.id === id) setActiveVideo(null);
      } catch (err) {
        alert('Failed to delete video.');
      }
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
            <p className="subtitle">Browse and manage all your created video content.</p>
          </div>
          <button onClick={fetchVideos} className="btn btn-outline">
            <span>Refresh</span>
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
          <p>Generate your first video from the Quotes section.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-card card">
              <div className="video-thumbnail-container" onClick={() => video.status === 'completed' && setActiveVideo(video)}>
                {video.status === 'completed' ? (
                  <div className="thumbnail-placeholder completed">
                    <div className="quote-preview">
                      <p className="quote-preview-text">"{video.quotes?.text || 'No quote text'}"</p>
                      {video.quotes?.author && <p className="quote-preview-author">— {video.quotes.author}</p>}
                    </div>
                  </div>
                ) : video.status === 'processing' ? (
                  <div className="thumbnail-placeholder processing">
                    <Loader2 className="animate-spin" size={32} />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="thumbnail-placeholder failed">
                    <AlertCircle size={32} />
                    <span>Failed</span>
                  </div>
                )}
              </div>

              <div className="video-info">
                <div className="video-status-row">
                  <span className={`status-badge ${video.status}`}>
                    {video.status === 'completed' && <CheckCircle2 size={14} />}
                    {video.status === 'processing' && <Clock size={14} />}
                    {video.status === 'failed' && <AlertCircle size={14} />}
                    {video.status}
                  </span>
                  <span className="video-date">{new Date(video.created_at!).toLocaleDateString()}</span>
                </div>
                
                <div className="video-actions">
                  {video.status === 'completed' && (
                    <>
                      <button onClick={() => setActiveVideo(video)} className="btn btn-sm btn-primary">
                        <Play size={14} /> Play
                      </button>
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Open Original">
                        <ExternalLink size={18} />
                      </a>
                    </>
                  )}
                  <button onClick={() => handleDelete(video.id!)} className="icon-btn danger" title="Delete Video">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeVideo && (
        <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <header className="video-modal-header">
              <h3>Video Preview</h3>
              <button onClick={() => setActiveVideo(null)} className="close-btn">
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </header>
            <div className="video-player-container">
              <video src={activeVideo.url} controls autoPlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;
