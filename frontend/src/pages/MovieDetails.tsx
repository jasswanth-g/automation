import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovie } from '../api/movie';
import { getSongs, deleteSong } from '../api/song';
import type { Movie, Song } from '../types';
import SongForm from '../components/SongForm';
import { Loader2, ArrowLeft, Plus, Music, Trash2, Calendar, Edit, Play } from 'lucide-react';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (movieId: string) => {
    try {
      setLoading(true);
      const [movieRes, songsRes] = await Promise.all([
        getMovie(movieId),
        getSongs(movieId)
      ]);
      setMovie(movieRes.data);
      setSongs(songsRes.data);
    } catch (err) {
      setError('Failed to fetch movie details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = () => {
    setEditingSong(null);
    setIsSongModalOpen(true);
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsSongModalOpen(true);
  };

  const handleDeleteSong = async (songId: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteSong(songId);
        setSongs(songs.filter(s => s.id !== songId));
        if (activeSong?.id === songId) setActiveSong(null);
      } catch (err) {
        alert('Failed to delete song.');
      }
    }
  };

  const handleSongSubmit = () => {
    if (id) fetchData(id);
    setIsSongModalOpen(false);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="error-state">
        <p>{error || 'Movie not found.'}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">Back to Movies</button>
      </div>
    );
  }

  return (
    <div className="movie-details-page">
      <button onClick={() => navigate('/')} className="btn btn-outline back-btn">
        <ArrowLeft size={18} />
        Back to Movies
      </button>

      <section className="movie-hero card">
        <div className="hero-content">
          <div className="hero-image">
            <img src={movie.image_url} alt={movie.title} />
          </div>
          <div className="hero-info">
            <div className="info-header">
              <h1>{movie.title}</h1>
              <div className="movie-meta">
                <span className="meta-item">
                  <Calendar size={16} />
                  {new Date(movie.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="description">{movie.description || 'No description available for this movie.'}</p>
            <div className="hero-actions">
              <Link to={`/movie/edit/${movie.id}`} className="btn btn-outline">
                <Edit size={18} />
                Edit Movie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="songs-section">
        <div className="section-header">
          <div className="header-title">
            <Music size={24} />
            <h2>Songs</h2>
            <span className="badge">{songs.length}</span>
          </div>
          <button onClick={handleAddSong} className="btn btn-primary">
            <Plus size={18} />
            Add Song
          </button>
        </div>

        {songs.length === 0 ? (
          <div className="empty-songs">
            <p>No songs added to this movie yet.</p>
            <button onClick={handleAddSong} className="btn btn-outline btn-sm">Add your first song</button>
          </div>
        ) : (
          <div className="song-list card">
            {songs.map((song, index) => (
              <div 
                key={song.id} 
                className={`song-item ${activeSong?.id === song.id ? 'active' : ''}`}
              >
                <div className="song-index">{index + 1}</div>
                <button 
                  className="play-icon-btn"
                  onClick={() => setActiveSong(song)}
                >
                  <Play size={18} fill={activeSong?.id === song.id ? "currentColor" : "none"} />
                </button>
                <div className="song-info">
                  <span className="song-name">{song.name}</span>
                </div>
                <div className="song-actions">
                  <button onClick={() => handleEditSong(song)} className="icon-btn" title="Edit Song">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteSong(song.id)} className="icon-btn danger" title="Delete Song">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeSong && (
        <div className="audio-player-fixed">
          <div className="player-container">
            <div className="player-info">
              <Music size={20} className="player-icon" />
              <div>
                <span className="player-song-name">{activeSong.name}</span>
                <span className="player-movie-title">{movie.title}</span>
              </div>
            </div>
            <audio 
              autoPlay 
              controls 
              src={activeSong.url} 
              className="player-element"
              key={activeSong.id}
            />
            <button onClick={() => setActiveSong(null)} className="close-player">
              <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>
      )}

      {isSongModalOpen && (
        <SongForm 
          movieId={movie.id}
          song={editingSong}
          onClose={() => setIsSongModalOpen(false)}
          onSuccess={handleSongSubmit}
        />
      )}
    </div>
  );
};

export default MovieDetails;
