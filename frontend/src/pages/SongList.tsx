import { useState, useEffect } from 'react';
import { getSongs, deleteSong } from '../api/song';
import { getMovies } from '../api/movie';
import type { Song, Movie } from '../types';
import SongForm from '../components/SongForm';
import { Loader2, Music, Trash2, Play, Plus, Film, Edit } from 'lucide-react';
import './SongList.css';

const SongList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [movies, setMovies] = useState<Record<string, Movie>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [songsRes, moviesRes] = await Promise.all([
        getSongs(),
        getMovies()
      ]);
      
      setSongs(songsRes.data);
      
      const movieLookup: Record<string, Movie> = {};
      moviesRes.data.forEach(movie => {
        movieLookup[movie.id] = movie;
      });
      setMovies(movieLookup);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch songs. Please try again later.');
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteSong(id);
        setSongs(songs.filter(song => song.id !== id));
        if (activeSong?.id === id) setActiveSong(null);
      } catch (err) {
        alert('Failed to delete song.');
      }
    }
  };

  const handleSongSuccess = () => {
    fetchData();
    setIsSongModalOpen(false);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="song-list-page">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Songs</h1>
            <p className="subtitle">All songs across your movie collection.</p>
          </div>
          <button onClick={handleAddSong} className="btn btn-primary">
            <Plus size={20} />
            <span>Add Song</span>
          </button>
        </div>
      </header>

      {songs.length === 0 ? (
        <div className="empty-state">
          <Music size={64} />
          <h3>No songs found</h3>
          <p>Songs are associated with movies. Start by adding your first song.</p>
          <button onClick={handleAddSong} className="btn btn-primary">
            <Plus size={20} />
            <span>Add your first song</span>
          </button>
        </div>
      ) : (
        <div className="song-grid card">
          <div className="song-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Movie</span>
            <span>Created At</span>
            <span>Actions</span>
          </div>
          {songs.map((song, index) => (
            <div key={song.id} className={`song-row ${activeSong?.id === song.id ? 'active' : ''}`}>
              <div className="song-index">{index + 1}</div>
              <div className="song-title-cell">
                <button 
                  className="play-btn-small"
                  onClick={() => setActiveSong(activeSong?.id === song.id ? null : song)}
                >
                  <Play size={16} fill={activeSong?.id === song.id ? "currentColor" : "none"} />
                </button>
                <span className="song-name-text">{song.name}</span>
              </div>
              <div className="song-movie-cell">
                {song.movie_id && movies[song.movie_id] ? (
                  <div className="movie-tag">
                    <Film size={14} />
                    <span>{movies[song.movie_id].title}</span>
                  </div>
                ) : (
                  <span className="text-muted">No Movie</span>
                )}
              </div>
              <div className="song-date-cell">
                {new Date(song.created_at).toLocaleDateString()}
              </div>
              <div className="song-actions-cell">
                <button onClick={() => handleEditSong(song)} className="icon-btn" title="Edit Song">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(song.id)} className="icon-btn danger" title="Delete Song">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSong && (
        <div className="audio-player-fixed">
          <div className="player-container">
            <div className="player-info">
              <Music size={20} className="player-icon" />
              <div>
                <span className="player-song-name">{activeSong.name}</span>
                <span className="player-movie-title">
                  {activeSong.movie_id && movies[activeSong.movie_id] ? movies[activeSong.movie_id].title : 'Unknown Movie'}
                </span>
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
          song={editingSong}
          onClose={() => setIsSongModalOpen(false)}
          onSuccess={handleSongSuccess}
        />
      )}
    </div>
  );
};

export default SongList;
