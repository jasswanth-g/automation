import { AlertCircle, AlignCenter, AlignLeft, AlignRight, ArrowLeft, CheckCircle2, Layout, Loader2, Music, Pause, Play, Scissors, Search, Type, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getMovies } from '../api/movie';
import { getSongs } from '../api/song';
import { generateVideo, getVideoStatus } from '../api/video';
import type { Movie, Quote, Song, VideoStatus } from '../types';
import './VideoGenerator.css';

interface VideoGeneratorProps {
  quote: Quote;
  onClose: () => void;
  onSuccess: () => void;
}

const VideoGenerator = ({ quote, onClose, onSuccess }: VideoGeneratorProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingSongs, setFetchingSongs] = useState(true);
  const [fetchingMovies, setFetchingMovies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Music selector modal state
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [tempSelectedMovieId, setTempSelectedMovieId] = useState<string | null>(null);

  // Load saved styles from localStorage
  const savedStyles = JSON.parse(localStorage.getItem('video_generator_styles') || '{}');

  // Styling state with defaults from localStorage
  const [fontSize, setFontSize] = useState(savedStyles.fontSize || 24); 
  const [fontColor, setFontColor] = useState(savedStyles.fontColor || '#000000');
  const [borderColor, setBorderColor] = useState(savedStyles.borderColor || 'transparent');
  const [position, setPosition] = useState<'top' | 'middle' | 'bottom'>(savedStyles.position || 'middle');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(savedStyles.textAlign || 'center');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>(savedStyles.aspectRatio || '9:16');
  const [videoText, setVideoText] = useState(quote.text);

  const [generationStatus, setGenerationStatus] = useState<VideoStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Audio trimming state
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [audioEndTime, setAudioEndTime] = useState(30);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setFetchingMovies(true);
      const res = await getMovies();
      setMovies(res.data);
    } catch (err) {
      console.error('Failed to fetch movies');
      setError('Failed to load movies.');
    } finally {
      setFetchingMovies(false);
      fetchAllSongs();
    }
  };

  // Detect total duration when song changes
  useEffect(() => {
    if (selectedSongId) {
      const song = songs.find(s => s.id === selectedSongId);
      if (song) {
        const audio = new Audio(song.url);
        audio.addEventListener('loadedmetadata', () => {
          const duration = audio.duration;
          setTotalDuration(duration);
          setAudioStartTime(0);
          setAudioEndTime(Math.min(30, duration));
          setAudioCurrentTime(0);
        });
      }
    }
  }, [selectedSongId, songs]);

  // Handle audio preview loop and progress tracking
  useEffect(() => {
    let interval: any;
    if (isPlaying && audioRef.current) {
      interval = setInterval(() => {
        if (audioRef.current) {
          setAudioCurrentTime(audioRef.current.currentTime);
          if (audioRef.current.currentTime >= audioEndTime) {
            audioRef.current.currentTime = audioStartTime;
            setAudioCurrentTime(audioStartTime);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioStartTime, audioEndTime]);

  const toggleAudioPreview = () => {
    if (!audioRef.current) {
      const song = songs.find(s => s.id === selectedSongId);
      if (!song) return;
      audioRef.current = new Audio(song.url);
      
      // Stop playback if it ends naturally (though we have the interval loop)
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioCurrentTime(audioStartTime);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = audioStartTime;
      audioRef.current.play();
      setIsPlaying(true);
      setAudioCurrentTime(audioStartTime);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
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

  const fetchAllSongs = async (movieId?: string) => {
    try {
      setFetchingSongs(true);
      const res = await getSongs(movieId);
      setSongs(res.data);
      // Reset selected song if it's not in the new list
      if (selectedSongId && !res.data.find(s => s.id === selectedSongId)) {
        setSelectedSongId('');
      }
    } catch (err) {
      console.error('Failed to fetch songs');
      setError('Failed to load songs. Please try again.');
    } finally {
      setFetchingSongs(false);
    }
  };

  const handleMovieSelect = (movieId: string) => {
    setTempSelectedMovieId(movieId);
    setMusicSearchQuery('');
    fetchAllSongs(movieId);
  };

  const handleSongSelect = (songId: string) => {
    setSelectedMovieId(tempSelectedMovieId || '');
    setSelectedSongId(songId);
    setIsMusicModalOpen(false);
    setMusicSearchQuery('');
    setTempSelectedMovieId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        audio_start_time: audioStartTime,
        audio_end_time: audioEndTime,
      }); 

      // Save styles to localStorage for next time
      const stylesToSave = {
        fontSize,
        fontColor,
        borderColor,
        position,
        textAlign,
        aspectRatio
      };
      localStorage.setItem('video_generator_styles', JSON.stringify(stylesToSave));

      setGenerationStatus(res.data);
      setIsPolling(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start video generation.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(musicSearchQuery.toLowerCase())
  );

  const filteredSongs = songs.filter(s => 
    s.name.toLowerCase().includes(musicSearchQuery.toLowerCase())
  );

  const currentSong = songs.find(s => s.id === selectedSongId) || (selectedSongId ? { name: 'Unknown Song' } : null);
  const currentMovie = movies.find(m => m.id === selectedMovieId);

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
                <h4><Type size={14} /> Font Size: {fontSize}px</h4>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="text-xs" title="Text Color">Text:</span>
                      <input 
                        type="color" 
                        value={fontColor} 
                        onChange={(e) => setFontColor(e.target.value)}
                        style={{ width: '24px', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="text-xs" title="Border/Outline Color">Out:</span>
                      <input 
                        type="color" 
                        value={borderColor === 'transparent' ? '#000000' : borderColor} 
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: 0 }}><Music size={14} /> Background Music</h4>
                {selectedSongId && totalDuration > 0 && (
                  <button 
                    className={`btn btn-xs ${isPlaying ? 'btn-primary' : 'btn-outline'}`}
                    onClick={toggleAudioPreview}
                    style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? 'Stop' : 'Preview'}
                  </button>
                )}
              </div>
              
              <div className="music-selector-trigger" onClick={() => {
                setIsMusicModalOpen(true);
                setTempSelectedMovieId(selectedMovieId || null);
                if (selectedMovieId) fetchAllSongs(selectedMovieId);
              }} style={{ cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-xs text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Selected Song:</span>
                  <span className="font-bold" style={{ fontSize: '0.9rem' }}>{currentSong ? (currentSong as any).name : 'No Song Selected'}</span>
                  {currentMovie && <span className="text-xs text-muted">Movie: {currentMovie.title}</span>}
                </div>
                <Search size={16} className="text-primary" />
              </div>

              {isMusicModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMusicModalOpen(false)} style={{ zIndex: 1000 }}>
                  <div className="modal-content music-search-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                    <header className="modal-header" style={{ padding: '1rem' }}>
                      <div className="title-with-icon">
                        {tempSelectedMovieId ? (
                          <button className="back-btn" onClick={() => setTempSelectedMovieId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={18} />
                          </button>
                        ) : <Music size={18} className="text-primary" />}
                        <h4 style={{ margin: 0 }}>{tempSelectedMovieId ? 'Select a Song' : 'Select a Movie'}</h4>
                      </div>
                      <button onClick={() => setIsMusicModalOpen(false)} className="close-btn" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                      </button>
                    </header>

                    <div className="search-bar-container" style={{ padding: '0 1rem 1rem' }}>
                      <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder={tempSelectedMovieId ? "Search songs..." : "Search movies..."}
                          value={musicSearchQuery}
                          onChange={(e) => setMusicSearchQuery(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="selection-list-container" style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
                      {!tempSelectedMovieId ? (
                        <div className="movies-list">
                          <div 
                            className="selection-item all-movies" 
                            onClick={() => handleMovieSelect('')}
                            style={{ padding: '0.8rem', borderBottom: '1px solid var(--gray-50)', cursor: 'pointer', borderRadius: '4px', marginBottom: '4px' }}
                          >
                            <span className="font-bold">-- All Movies --</span>
                          </div>
                          {filteredMovies.map(movie => (
                            <div 
                              key={movie.id} 
                              className={`selection-item ${selectedMovieId === movie.id ? 'active' : ''}`}
                              onClick={() => handleMovieSelect(movie.id)}
                              style={{ padding: '0.8rem', borderBottom: '1px solid var(--gray-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '4px' }}
                            >
                              <img src={movie.image_url} alt={movie.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                              <span className="font-bold">{movie.title}</span>
                            </div>
                          ))}
                          {filteredMovies.length === 0 && !fetchingMovies && (
                            <p className="text-center text-muted p-4">No movies found matching "{musicSearchQuery}"</p>
                          )}
                          {fetchingMovies && <div className="text-center p-4"><Loader2 className="animate-spin mx-auto" size={24} /></div>}
                        </div>
                      ) : (
                        <div className="songs-list">
                          <div className="selected-movie-info" style={{ background: 'var(--gray-50)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                              src={movies.find(m => m.id === tempSelectedMovieId)?.image_url} 
                              alt="Movie" 
                              style={{ width: '30px', height: '30px', borderRadius: '3px', objectFit: 'cover' }} 
                            />
                            <span className="text-xs font-bold">Showing songs for: {movies.find(m => m.id === tempSelectedMovieId)?.title || 'All Movies'}</span>
                          </div>
                          {filteredSongs.map(song => (
                            <div 
                              key={song.id} 
                              className={`selection-item ${selectedSongId === song.id ? 'active' : ''}`}
                              onClick={() => handleSongSelect(song.id)}
                              style={{ padding: '0.8rem', borderBottom: '1px solid var(--gray-50)', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <span className="font-bold">{song.name}</span>
                              {selectedSongId === song.id && <div className="active-dot" style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%' }} />}
                            </div>
                          ))}
                          {filteredSongs.length === 0 && !fetchingSongs && (
                            <p className="text-center text-muted p-4">No songs found matching "{musicSearchQuery}"</p>
                          )}
                          {fetchingSongs && <div className="text-center p-4"><Loader2 className="animate-spin mx-auto" size={24} /></div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedSongId && totalDuration > 0 && (
                <div className="audio-trim-controls" style={{ marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scissors size={14} className="text-muted" />
                      <span className="text-xs font-bold">Trim Music ({formatTime(audioEndTime - audioStartTime)} selected)</span>
                    </div>
                    {isPlaying && (
                      <span className="text-xs font-mono text-primary animate-pulse">
                        Playing: {formatTime(audioCurrentTime)}
                      </span>
                    )}
                  </div>
                  
                  {isPlaying && (
                    <div className="playback-progress-bar" style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '1rem', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: `${(audioStartTime / totalDuration) * 100}%`, 
                          width: `${((audioEndTime - audioStartTime) / totalDuration) * 100}%`,
                          height: '100%',
                          background: 'var(--primary-color)',
                          opacity: 0.2
                        }} 
                      />
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: `${(audioCurrentTime / totalDuration) * 100}%`, 
                          width: '2px',
                          height: '100%',
                          background: 'var(--primary-color)',
                          zIndex: 3
                        }} 
                      />
                    </div>
                  )}
                  
                  <div className="trim-sliders" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="trim-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span className="text-xs">Start: {formatTime(audioStartTime)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={Math.max(0, totalDuration - 1)} 
                        step="1"
                        value={audioStartTime} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAudioStartTime(val);
                          if (val >= audioEndTime) setAudioEndTime(Math.min(val + 1, totalDuration));
                        }}
                        className="range-input"
                      />
                    </div>
                    
                    <div className="trim-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span className="text-xs">End: {formatTime(audioEndTime)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={audioStartTime + 1} 
                        max={totalDuration} 
                        step="1"
                        value={audioEndTime} 
                        onChange={(e) => setAudioEndTime(parseInt(e.target.value))}
                        className="range-input"
                      />
                    </div>
                  </div>
                </div>
              )}
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
