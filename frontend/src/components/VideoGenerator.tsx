import { AlertCircle, AlignCenter, AlignLeft, AlignRight, CheckCircle2, Layout, Loader2, Music, Type, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSongs } from '../api/song';
import { generateVideo, getVideoStatus } from '../api/video';
import type { Quote, Song, VideoStatus } from '../types';
import './VideoGenerator.css';

interface VideoGeneratorProps {
  quote: Quote;
  onClose: () => void;
  onSuccess: () => void;
}

const VideoGenerator = ({ quote, onClose, onSuccess }: VideoGeneratorProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingSongs, setFetchingSongs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  // Styling state
  const [fontSize, setFontSize] = useState(24); 
  const [fontColor, setFontColor] = useState('#000000');
  const [borderColor, setBorderColor] = useState('transparent');
  const [position, setPosition] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [videoText, setVideoText] = useState(quote.text);

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

      // Accurate scale based on preview width vs video width
      // 9:16 -> Video 720 / Preview 300 = 2.4
      // 16:9 -> Video 1280 / Preview 480 = 2.66...
      const scale = aspectRatio === '9:16' ? 2.4 : 2.67;
      const scaledFontSize = Math.round(fontSize * scale);

      console.log('[VideoGenerator] Debug Info:', {
        aspectRatio,
        scale,
        previewFontSize: fontSize,
        scaledFontSize,
        textLength: videoText.length,
        lines: videoText.split('\n').length
      });

      const res = await generateVideo({
        quote_id: quote.id,
        song_id: selectedSongId,
        text: videoText,
        font_size: scaledFontSize,
        font_color: fontColor,
        border_color: borderColor,
        position: position,
        text_align: textAlign,
        aspect_ratio: aspectRatio,
      }); 

      setGenerationStatus(res.data);
      setIsPolling(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start video generation.');
    } finally {
      setLoading(false);
    }
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
          <p className="text-muted mt-2 mb-4">Your video has been created.</p>
          
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
            <a href={generationStatus.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Open Video
            </a>
            <button onClick={onClose} className="btn btn-outline">Close</button>
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
            <div className={`wysiwyg-preview ratio-${aspectRatio.replace(':', '-')}`}>
              <div 
                className={`preview-overlay-text ${position}`}
                style={{
                  fontSize: `${fontSize}px`,
                  color: fontColor,
                  textAlign: textAlign,
                  textShadow: borderColor === 'transparent' ? 'none' : `-1px -1px 0 ${borderColor}, 1px -1px 0 ${borderColor}, -1px 1px 0 ${borderColor}, 1px 1px 0 ${borderColor}`,
                  whiteSpace: 'pre-wrap' // Important for manual line breaks
                }}
              >
                {videoText}
              </div>
            </div>
            <p className="text-xs text-muted mt-4">Live Preview ({aspectRatio})</p>
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
              <h4><AlignLeft size={14} /> Edit Video Text</h4>
              <textarea 
                className="video-text-editor"
                value={videoText}
                onChange={(e) => setVideoText(e.target.value)}
                placeholder="Enter text here... use Enter for new lines"
                rows={4}
              />
            </div>

            <div className="control-section">
              <h4><Layout size={14} /> Aspect Ratio</h4>
              <div className="pos-btn-group">
                <button 
                  className={`pos-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('9:16')}
                >9:16</button>
                <button 
                  className={`pos-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('16:9')}
                >16:9</button>
              </div>
            </div>

            <div className="style-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="control-section">
                <h4><Type size={14} /> Font Size</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <input 
                    type="range" 
                    min="14" 
                    max="48" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="range-input"
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="color" 
                    value={fontColor} 
                    onChange={(e) => setFontColor(e.target.value)}
                    title="Font Color"
                    style={{ flex: '1 1 100%' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="text-xs" title="Text Color">Text:</span>
                    <input 
                      type="color" 
                      value={fontColor.startsWith('0x') ? fontColor.replace('0x', '#') : fontColor} 
                      onChange={(e) => setFontColor(e.target.value)}
                      style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="text-xs" title="Border/Outline Color">Out:</span>
                    <input 
                      type="color" 
                      value={borderColor === 'transparent' ? '#000000' : (borderColor.startsWith('0x') ? borderColor.replace('0x', '#') : borderColor)} 
                      onChange={(e) => setBorderColor(e.target.value)}
                      disabled={borderColor === 'transparent'}
                      style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: borderColor === 'transparent' ? 'not-allowed' : 'pointer', opacity: borderColor === 'transparent' ? 0.5 : 1 }}
                    />
                    <button 
                      className={`btn btn-xs ${borderColor === 'transparent' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setBorderColor(borderColor === 'transparent' ? '#000000' : 'transparent')}
                      style={{ padding: '2px 4px', fontSize: '10px' }}
                    >
                      {borderColor === 'transparent' ? 'Add' : 'None'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="control-section">
                <h4><Layout size={14} /> Position & Align</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="pos-btn-group">
                    <button className={`pos-btn ${position === 'top' ? 'active' : ''}`} onClick={() => setPosition('top')} title="Top">T</button>
                    <button className={`pos-btn ${position === 'middle' ? 'active' : ''}`} onClick={() => setPosition('middle')} title="Middle">M</button>
                    <button className={`pos-btn ${position === 'bottom' ? 'active' : ''}`} onClick={() => setPosition('bottom')} title="Bottom">B</button>
                  </div>
                  <div className="pos-btn-group">
                    <button className={`pos-btn ${textAlign === 'left' ? 'active' : ''}`} onClick={() => setTextAlign('left')} title="Align Left"><AlignLeft size={14} /></button>
                    <button className={`pos-btn ${textAlign === 'center' ? 'active' : ''}`} onClick={() => setTextAlign('center')} title="Align Center"><AlignCenter size={14} /></button>
                    <button className={`pos-btn ${textAlign === 'right' ? 'active' : ''}`} onClick={() => setTextAlign('right')} title="Align Right"><AlignRight size={14} /></button>
                  </div>
                </div>
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
              <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel</button>
              <button onClick={handleGenerate} className="btn btn-primary" disabled={loading || !selectedSongId}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
                <span>Generate Video</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
