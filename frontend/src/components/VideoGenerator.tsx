import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSongs } from '../api/song';
import { generateVideo, getVideoStatus } from '../api/video';
import type { Song, Quote, VideoStatus } from '../types';
import { Loader2, X, Video, CheckCircle2, AlertCircle, Music, Type, Layout } from 'lucide-react';
import './VideoGenerator.css';

interface VideoGeneratorProps {
  quote: Quote;
  onClose: () => void;
  onSuccess: () => void;
}

const VideoGenerator = ({ quote, onClose, onSuccess }: VideoGeneratorProps) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingSongs, setFetchingSongs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Styling state
  const [fontSize, setFontSize] = useState(24); // CSS px (approx 1/3 of FFmpeg's 72)
  const [fontColor, setFontColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#000000');
  const [position, setPosition] = useState<'top' | 'middle' | 'bottom'>('middle');

  const [generationStatus, setGenerationStatus] = useState<VideoStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPolling && generationStatus?.id) {
      interval = setInterval(async () => {
        try {
          const res = await getVideoStatus(generationStatus.id);
          setGenerationStatus(res.data);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            setIsPolling(false);
            if (res.data.status === 'completed') {
              onSuccess();
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
          setIsPolling(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, generationStatus, onSuccess]);

  const fetchAllSongs = async () => {
    try {
      setFetchingSongs(true);
      const res = await getSongs();
      setSongs(res.data);
      if (res.data.length > 0) {
        setSelectedSongId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch songs');
      setError('Failed to load songs. Please try again.');
    } finally {
      setFetchingSongs(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSongId) {
      setError('Please select a song.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await generateVideo({
        quote_id: quote.id,
        song_id: selectedSongId,
        font_size: fontSize * 3, // Convert CSS px to FFmpeg units approx
        font_color: fontColor,
        border_color: borderColor,
        position: position
      });
      setGenerationStatus(res.data);
      setIsPolling(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start video generation.');
    } finally {
      setLoading(false);
    }
  };

  const goToVideos = () => {
    onClose();
    navigate('/videos');
  };

  if (generationStatus && isPolling) {
    return (
      <div className="modal-overlay">
        <div className="modal-content card text-center p-8">
          <Loader2 className="animate-spin mx-auto text-primary mb-4" size={48} />
          <h3>Generating Video...</h3>
          <p className="text-muted mt-2">We're processing your video. This may take a minute.</p>
          <p className="status-text mt-4">Status: <span className="capitalize font-bold">{generationStatus.status}</span></p>
        </div>
      </div>
    );
  }

  if (generationStatus?.status === 'completed') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content card text-center p-8" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
          <h3>Video Generated Successfully!</h3>
          <p className="text-muted mt-2 mb-4">Your masterpiece is ready.</p>
          
          <div className="video-preview-container mb-6" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '9/16' }}>
            <video 
              src={generationStatus.url} 
              controls 
              autoPlay
              className="w-full h-full"
              style={{ maxHeight: '400px', width: '100%', display: 'block' }}
            />
          </div>

          <div className="success-actions">
            <button onClick={goToVideos} className="btn btn-primary">
              View in Gallery
            </button>
            <button onClick={onClose} className="btn btn-outline">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card video-gen-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-with-icon">
            <Video size={20} className="text-primary" />
            <h3>WYSIWYG Video Generator</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <div className="video-gen-container">
          {/* LEFT: PREVIEW */}
          <div className="video-preview-column">
            <div className="wysiwyg-preview">
              <div 
                className={`preview-overlay-text ${position}`}
                style={{
                  fontSize: `${fontSize}px`,
                  color: fontColor,
                  textShadow: `
                    -2px -2px 0 ${borderColor},  
                     2px -2px 0 ${borderColor},
                    -2px  2px 0 ${borderColor},
                     2px  2px 0 ${borderColor}
                  `
                }}
              >
                {quote.text}
              </div>
            </div>
            <p className="text-xs text-muted mt-4">Live Preview (Vertical 9:16)</p>
          </div>

          {/* RIGHT: CONTROLS */}
          <div className="video-controls-column">
            {error && (
              <div className="form-error flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="control-section">
              <h4><Type size={14} /> Text Styling</h4>
              <div className="style-grid">
                <div className="form-group">
                  <label>Font Size ({fontSize}px)</label>
                  <input 
                    type="range" 
                    min="14" 
                    max="48" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="range-input"
                  />
                </div>
                <div className="form-group">
                  <label>Font Color</label>
                  <div className="color-input-wrapper">
                    <input 
                      type="color" 
                      value={fontColor} 
                      onChange={(e) => setFontColor(e.target.value)}
                      className="color-picker"
                    />
                    <span className="text-xs uppercase">{fontColor}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Border Color</label>
                  <div className="color-input-wrapper">
                    <input 
                      type="color" 
                      value={borderColor} 
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="color-picker"
                    />
                    <span className="text-xs uppercase">{borderColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="control-section">
              <h4><Layout size={14} /> Position</h4>
              <div className="pos-btn-group">
                <button 
                  className={`pos-btn ${position === 'top' ? 'active' : ''}`}
                  onClick={() => setPosition('top')}
                >Top</button>
                <button 
                  className={`pos-btn ${position === 'middle' ? 'active' : ''}`}
                  onClick={() => setPosition('middle')}
                >Middle</button>
                <button 
                  className={`pos-btn ${position === 'bottom' ? 'active' : ''}`}
                  onClick={() => setPosition('bottom')}
                >Bottom</button>
              </div>
            </div>

            <div className="control-section">
              <h4><Music size={14} /> Background Music</h4>
              <div className="select-wrapper">
                <select 
                  value={selectedSongId} 
                  onChange={(e) => setSelectedSongId(e.target.value)}
                  disabled={fetchingSongs || loading}
                >
                  <option value="">-- Select Music --</option>
                  {songs.map(song => (
                    <option key={song.id} value={song.id}>{song.name}</option>
                  ))}
                </select>
                {fetchingSongs && <Loader2 className="animate-spin select-loader" size={16} />}
              </div>
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="btn btn-primary"
                disabled={loading || !selectedSongId}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    Generate MP4
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
