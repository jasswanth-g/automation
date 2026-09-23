import { AlertCircle, AlignLeft, CheckCircle2, Image as ImageIcon, Layout, Loader2, Music, Play, Scissors, Sliders, Type, Upload, Video, X } from 'lucide-react';
import { useEffect, useState, useRef, type ChangeEvent, type SyntheticEvent } from 'react';
import { getSongs, createSong } from '../api/song';
import { getMovies } from '../api/movie';
import { generateVideo, getVideoStatus } from '../api/video';
import type { Movie, Quote, Song, VideoStatus } from '../types';
import './VideoGenerator.css';

interface VideoGeneratorProps {
  quote?: Quote;
  onClose: () => void;
  onSuccess: () => void;
}

const VideoGenerator = ({ quote, onClose, onSuccess }: VideoGeneratorProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingSongs, setFetchingSongs] = useState(true);
  const [fetchingMovies, setFetchingMovies] = useState(false);
  const [uploadingSong, setUploadingSong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Image & Audio State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');

  // Audio Trimming State
  const [audioStartTime, setAudioStartTime] = useState<number>(0);
  const [audioEndTime, setAudioEndTime] = useState<number>(0);
  const [totalSongDuration, setTotalSongDuration] = useState<number>(0);
  const [isPlayingSegment, setIsPlayingSegment] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Styling state
  const [fontSize, setFontSize] = useState(24); 
  const [fontColor, setFontColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#000000');
  const [position, setPosition] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [videoText, setVideoText] = useState(quote?.text || '');

  // Fade Effects state
  const [fadeInDuration, setFadeInDuration] = useState<number>(1);
  const [fadeOutDuration, setFadeOutDuration] = useState<number>(1);
  const [applyVideoFade, setApplyVideoFade] = useState<boolean>(true);
  const [applyAudioFade, setApplyAudioFade] = useState<boolean>(true);

  const [generationStatus, setGenerationStatus] = useState<VideoStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchAllSongs();
    fetchAllMovies();
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
        if (res.data[0].url) {
          setAudioPreviewUrl(res.data[0].url);
        }
      }
    } catch (err) {
      console.error('Failed to fetch songs');
      setError('Failed to load songs. Please try again.');
    } finally {
      setFetchingSongs(false);
    }
  };

  const fetchAllMovies = async () => {
    try {
      setFetchingMovies(true);
      const res = await getMovies();
      setMovies(res.data);
    } catch (err) {
      console.error('Failed to fetch movies');
    } finally {
      setFetchingMovies(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreviewUrl(result);
        setImageBase64(result);
        setImageUrl('');
        setSelectedMovieId('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectMovie = (movieId: string) => {
    setSelectedMovieId(movieId);
    if (!movieId) {
      setImageUrl('');
      if (!imageBase64) setImagePreviewUrl('');
      return;
    }
    const movie = movies.find(m => m.id === movieId);
    if (movie && movie.image_url) {
      setImageUrl(movie.image_url);
      setImagePreviewUrl(movie.image_url);
      setImageBase64('');
    }
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    setAudioStartTime(0);
    const found = songs.find(s => s.id === songId);
    if (found?.url) {
      setAudioPreviewUrl(found.url);
    } else {
      setAudioPreviewUrl('');
      setAudioEndTime(0);
      setTotalSongDuration(0);
    }
  };

  const handleLoadedMetadata = (e: SyntheticEvent<HTMLAudioElement, Event>) => {
    const duration = Math.floor(e.currentTarget.duration) || 0;
    setTotalSongDuration(duration);
    if (!audioEndTime || audioEndTime > duration || audioEndTime === 0) {
      setAudioEndTime(duration > 0 ? duration : 30);
    }
  };

  const handleTestSegment = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = audioStartTime;
      audioRef.current.play();
      setIsPlayingSegment(true);
    }
  };

  const handleTimeUpdate = (e: SyntheticEvent<HTMLAudioElement, Event>) => {
    if (isPlayingSegment && audioEndTime > 0) {
      if (e.currentTarget.currentTime >= audioEndTime) {
        e.currentTarget.pause();
        setIsPlayingSegment(false);
      }
    }
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      setError('Please select a valid audio file (.mp3, .wav, .m4a, .aac, .ogg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setUploadingSong(true);
        setError(null);
        setAudioStartTime(0);
        const base64 = event.target?.result as string;
        const songName = file.name.replace(/\.[^/.]+$/, "");
        const res = await createSong({ name: songName, base64 });
        
        const newSong = res.data;
        setSongs(prev => [newSong, ...prev]);
        setSelectedSongId(newSong.id);
        setAudioPreviewUrl(newSong.url || URL.createObjectURL(file));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to upload song.');
      } finally {
        setUploadingSong(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedSongId) {
      setError('Please select or upload a song.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scale = aspectRatio === '9:16' ? 2.4 : 2.67;
      const scaledFontSize = Math.round(fontSize * scale);

      const payload: any = {
        song_id: selectedSongId,
        text: videoText,
        font_size: scaledFontSize,
        font_color: fontColor,
        border_color: borderColor,
        position: position,
        aspect_ratio: aspectRatio,
        audio_start_time: audioStartTime,
        audio_end_time: audioEndTime,
        fade_in_duration: fadeInDuration,
        fade_out_duration: fadeOutDuration,
        video_fade_in: applyVideoFade ? fadeInDuration : 0,
        video_fade_out: applyVideoFade ? fadeOutDuration : 0,
        audio_fade_in: applyAudioFade ? fadeInDuration : 0,
        audio_fade_out: applyAudioFade ? fadeOutDuration : 0,
      };

      if (quote?.id) {
        payload.quote_id = quote.id;
      }

      if (imageBase64) {
        payload.image_base64 = imageBase64;
      } else if (imageUrl) {
        payload.image_url = imageUrl;
      }

      const res = await generateVideo(payload);
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
          <p className="text-muted mt-2">We're rendering your custom image, text overlay, and trimmed music segment. This may take a minute.</p>
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
          <p className="text-muted mt-2 mb-4">Your video is ready with custom image, text, and trimmed music.</p>
          
          <div className="video-preview-container mb-6" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9' }}>
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

  const activeBgImage = imagePreviewUrl || 'https://ik.imagekit.io/jasswanth/test.jpg';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card video-gen-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-with-icon">
            <Video size={20} className="text-primary" />
            <h3>{quote ? 'Quote Video Generator' : 'Direct Image + Text Video Creator'}</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <div className="video-gen-container">
          {/* LEFT: PREVIEW */}
          <div className="video-preview-column">
            <div 
              className={`wysiwyg-preview ratio-${aspectRatio.replace(':', '-')}`}
              style={{ backgroundImage: `url(${activeBgImage})` }}
            >
              <div 
                className={`preview-overlay-text ${position}`}
                style={{
                  fontSize: `${fontSize}px`,
                  color: fontColor,
                  textShadow: borderColor === 'transparent' ? 'none' : `-1px -1px 0 ${borderColor}, 1px -1px 0 ${borderColor}, -1px 1px 0 ${borderColor}, 1px 1px 0 ${borderColor}`,
                  whiteSpace: 'pre-wrap'
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

            {/* Background Image Upload / Selection */}
            <div className="control-section">
              <h4><ImageIcon size={14} /> Background Image</h4>
              <div className="image-source-options">
                <label className="custom-file-upload btn btn-outline btn-sm w-full">
                  <Upload size={14} />
                  <span>Upload Custom Image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
                {movies.length > 0 && (
                  <div className="select-wrapper mt-2">
                    <select 
                      value={selectedMovieId}
                      onChange={(e) => handleSelectMovie(e.target.value)}
                      disabled={fetchingMovies}
                    >
                      <option value="">-- Or Select Movie Cover Image --</option>
                      {movies.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="control-section">
              <h4><AlignLeft size={14} /> Video Text Overlay</h4>
              <textarea 
                className="video-text-editor"
                value={videoText}
                onChange={(e) => setVideoText(e.target.value)}
                placeholder="Enter text here (optional)... use Enter for new lines"
                rows={3}
              />
            </div>

            <div className="control-section">
              <h4><Layout size={14} /> Aspect Ratio</h4>
              <div className="pos-btn-group">
                <button 
                  className={`pos-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('9:16')}
                >9:16 (Story / Reel)</button>
                <button 
                  className={`pos-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('16:9')}
                >16:9 (Landscape)</button>
              </div>
            </div>

            <div className="style-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="control-section">
                <h4><Type size={14} /> Font Formatting</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="text-xs">Size:</span>
                    <input 
                      type="range" 
                      min="14" 
                      max="48" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="range-input"
                      style={{ flex: 1 }}
                    />
                    <span className="text-xs font-bold">{fontSize}px</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="text-xs">Color:</span>
                      <input 
                        type="color" 
                        value={fontColor.startsWith('0x') ? fontColor.replace('0x', '#') : fontColor} 
                        onChange={(e) => setFontColor(e.target.value)}
                        style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="text-xs">Outline:</span>
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
              </div>
              <div className="control-section">
                <h4><Layout size={14} /> Vertical Position</h4>
                <div className="pos-btn-group">
                  <button className={`pos-btn ${position === 'top' ? 'active' : ''}`} onClick={() => setPosition('top')}>Top</button>
                  <button className={`pos-btn ${position === 'middle' ? 'active' : ''}`} onClick={() => setPosition('middle')}>Center</button>
                  <button className={`pos-btn ${position === 'bottom' ? 'active' : ''}`} onClick={() => setPosition('bottom')}>Bottom</button>
                </div>
              </div>
            </div>

            <div className="control-section">
              <h4><Music size={14} /> Background Music & Trimming</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="select-wrapper" style={{ flex: 1 }}>
                    <select 
                      value={selectedSongId} 
                      onChange={(e) => handleSelectSong(e.target.value)}
                      disabled={fetchingSongs || loading || uploadingSong}
                    >
                      <option value="">-- Select Music --</option>
                      {songs.map(song => (
                        <option key={song.id} value={song.id}>{song.name}</option>
                      ))}
                    </select>
                    {fetchingSongs && <Loader2 className="animate-spin select-loader" size={16} />}
                  </div>
                  <label className="custom-file-upload btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>
                    {uploadingSong ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    <span>{uploadingSong ? 'Uploading...' : 'Upload Song'}</span>
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} disabled={uploadingSong || loading} style={{ display: 'none' }} />
                  </label>
                </div>

                {audioPreviewUrl && (
                  <div className="audio-preview-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span className="text-xs text-muted block">Audio Track Preview:</span>
                    <audio 
                      ref={audioRef}
                      src={audioPreviewUrl} 
                      controls 
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      style={{ width: '100%', height: '36px', borderRadius: '6px' }} 
                    />
                    
                    {/* Trimming Controls */}
                    <div className="audio-trim-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="text-xs font-bold flex items-center gap-1">
                          <Scissors size={12} /> Trim Segment
                        </span>
                        <span className="text-xs text-muted">
                          Segment: {Math.max(0, audioEndTime - audioStartTime)}s {totalSongDuration > 0 ? `(Total: ${totalSongDuration}s)` : ''}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <div>
                          <label className="text-xs text-muted block mb-1">Start Time (sec):</label>
                          <input 
                            type="number" 
                            min="0" 
                            max={Math.max(0, audioEndTime - 1)} 
                            value={audioStartTime} 
                            onChange={(e) => setAudioStartTime(Math.max(0, parseInt(e.target.value) || 0))}
                            className="text-xs p-1 border rounded w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted block mb-1">End Time (sec):</label>
                          <input 
                            type="number" 
                            min={audioStartTime + 1} 
                            max={totalSongDuration || 600} 
                            value={audioEndTime} 
                            onChange={(e) => setAudioEndTime(Math.max(audioStartTime + 1, parseInt(e.target.value) || 0))}
                            className="text-xs p-1 border rounded w-full"
                          />
                        </div>
                        <div style={{ alignSelf: 'flex-end' }}>
                          <button 
                            type="button"
                            onClick={handleTestSegment} 
                            className="btn btn-outline btn-xs"
                            title="Play selected segment"
                            style={{ height: '28px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Play size={12} />
                            <span>Test</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fade In / Fade Out Controls */}
            <div className="control-section">
              <h4><Sliders size={14} /> Fade Effects (In & Out)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="text-xs font-semibold">Fade In:</span>
                      <span className="text-xs font-bold text-primary">{fadeInDuration}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.5" 
                      value={fadeInDuration} 
                      onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
                      className="range-input"
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="text-xs font-semibold">Fade Out:</span>
                      <span className="text-xs font-bold text-primary">{fadeOutDuration}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.5" 
                      value={fadeOutDuration} 
                      onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
                      className="range-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={applyVideoFade} 
                      onChange={(e) => setApplyVideoFade(e.target.checked)} 
                    />
                    <span>Video Fade (Black transition)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={applyAudioFade} 
                      onChange={(e) => setApplyAudioFade(e.target.checked)} 
                    />
                    <span>Audio Fade (Volume transition)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel</button>
              <button onClick={handleGenerate} className="btn btn-primary" disabled={loading || !selectedSongId || uploadingSong}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
                <span>Generate Video Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
