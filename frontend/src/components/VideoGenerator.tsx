import { useState, useEffect } from 'react';
import { getMovies, getMovie } from '../api/movie';
import { generateVideo, getVideoStatus } from '../api/video';
import type { Movie, Song, Quote, VideoStatus } from '../types';
import { Loader2, X, Video, Film, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import './VideoGenerator.css';

interface VideoGeneratorProps {
  quote: Quote;
  onClose: () => void;
  onSuccess: () => void;
}

const VideoGenerator = ({ quote, onClose, onSuccess }: VideoGeneratorProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [movieSongs, setMovieSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingMovies, setFetchingMovies] = useState(true);
  const [fetchingSongs, setFetchingSongs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generationStatus, setGenerationStatus] = useState<VideoStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (selectedMovieId) {
      fetchMovieSongs(selectedMovieId);
    } else {
      setMovieSongs([]);
      setSelectedSongId('');
    }
  }, [selectedMovieId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  const fetchMovies = async () => {
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

  const fetchMovieSongs = async (id: string) => {
    try {
      setFetchingSongs(true);
      const res = await getMovie(id);
      setMovieSongs(res.data.songs || []);
      if (res.data.songs?.length > 0) {
        setSelectedSongId(res.data.songs[0].id);
      } else {
        setSelectedSongId('');
      }
    } catch (err) {
      console.error('Failed to fetch movie songs');
    } finally {
      setFetchingSongs(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedMovieId || !selectedSongId) {
      setError('Please select both a movie and a song.');
      return;
    }

    const movie = movies.find(m => m.id === selectedMovieId);
    const song = movieSongs.find(s => s.id === selectedSongId);

    if (!movie || !song) return;

    try {
      setLoading(true);
      setError(null);
      const res = await generateVideo({
        quote_id: quote.id,
        song_id: selectedSongId
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
        <div className="modal-content card text-center p-8" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
          <h3>Video Generated Successfully!</h3>
          <p className="text-muted mt-2 mb-4">The quote has been updated to 'Video: Created'.</p>
          
          <div className="video-preview-container mb-6" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '9/16' }}>
            <video 
              src={generationStatus.url} 
              controls 
              className="w-full h-full"
              style={{ maxHeight: '400px', width: '100%', display: 'block' }}
            />
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            <a href={generationStatus.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" download>
              Download
            </a>
            <button onClick={onClose} className="btn btn-outline">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-with-icon">
            <Video size={20} className="text-primary" />
            <h3>Generate Video for Quote</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <div className="video-gen-body">
          <div className="quote-preview mb-6 p-4 bg-gray-50 rounded-lg italic">
            "{quote.text}"
          </div>

          {error && (
            <div className="form-error mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {generationStatus?.status === 'failed' && (
            <div className="form-error mb-4">
              <strong>Generation Failed:</strong> {generationStatus.error}
            </div>
          )}

          <div className="form-group">
            <label>Select Background Image (from Movie)</label>
            <div className="select-wrapper">
              <select 
                value={selectedMovieId} 
                onChange={(e) => setSelectedMovieId(e.target.value)}
                disabled={fetchingMovies || loading}
              >
                <option value="">-- Choose a Movie --</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.id}>{movie.title}</option>
                ))}
              </select>
              {fetchingMovies && <Loader2 className="animate-spin select-loader" size={16} />}
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Select Background Music (from Song)</label>
            <div className="select-wrapper">
              <select 
                value={selectedSongId} 
                onChange={(e) => setSelectedSongId(e.target.value)}
                disabled={!selectedMovieId || fetchingSongs || loading}
              >
                <option value="">-- Choose a Song --</option>
                {movieSongs.map(song => (
                  <option key={song.id} value={song.id}>{song.name}</option>
                ))}
              </select>
              {fetchingSongs && <Loader2 className="animate-spin select-loader" size={16} />}
            </div>
            {!selectedMovieId && <p className="text-xs text-muted mt-1">Select a movie first to see its songs.</p>}
            {selectedMovieId && movieSongs.length === 0 && !fetchingSongs && (
              <p className="text-xs text-danger mt-1">This movie has no songs. Please select another movie.</p>
            )}
          </div>

          <div className="modal-actions mt-8">
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
              disabled={loading || !selectedMovieId || !selectedSongId}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Starting...
                </>
              ) : (
                <>
                  <Video size={18} />
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
