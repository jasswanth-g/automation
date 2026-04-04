import { useState, useEffect } from 'react';
import { createSong, updateSong } from '../api/song';
import { getMovies } from '../api/movie';
import type { Song, Movie } from '../types';
import { fileToBase64 } from '../utils/base64';
import { Loader2, X, Music, Upload } from 'lucide-react';
import './SongForm.css';

interface SongFormProps {
  movieId?: string;
  song: Song | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SongForm = ({ movieId, song, onClose, onSuccess }: SongFormProps) => {
  const isEdit = Boolean(song);
  const [formData, setFormData] = useState({
    name: song?.name || '',
    base64: '',
    movie_id: song?.movie_id || movieId || '',
  });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMovies, setFetchingMovies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId && !isEdit) {
      fetchMovies();
    }
  }, [movieId, isEdit]);

  const fetchMovies = async () => {
    try {
      setFetchingMovies(true);
      const res = await getMovies();
      setMovies(res.data);
    } catch (err) {
      console.error('Failed to fetch movies', err);
    } finally {
      setFetchingMovies(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, base64 }));
        setFileName(file.name);
        if (!formData.name) {
          const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
          setFormData(prev => ({ ...prev, name: nameWithoutExt }));
        }
      } catch (err) {
        alert('Failed to process audio file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('Song name is required.');
      return;
    }

    if (!isEdit && !formData.base64) {
      setError('Audio file is required for new songs.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && song) {
        const updateData: any = { name: formData.name };
        if (formData.base64) updateData.base64 = formData.base64;
        if (formData.movie_id) updateData.movie_id = formData.movie_id;
        await updateSong(song.id, updateData);
      } else {
        await createSong({
          ...formData,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save song.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{isEdit ? 'Edit Song' : 'Add New Song'}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="song-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="song-name">Song Name *</label>
            <input
              type="text"
              id="song-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. My Heart Will Go On"
              required
            />
          </div>

          {!movieId && !isEdit && (
            <div className="form-group">
              <label htmlFor="movie_id">Associated Movie (Optional)</label>
              <div className="select-wrapper">
                <select
                  id="movie_id"
                  name="movie_id"
                  value={formData.movie_id}
                  onChange={handleInputChange}
                  disabled={fetchingMovies}
                >
                  <option value="">No Movie (Independent Song)</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
                {fetchingMovies && <Loader2 className="animate-spin select-loader" size={16} />}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Audio File {!isEdit && '*'}</label>
            <div className="file-upload-area">
              <label htmlFor="audio-upload" className={`file-label ${fileName ? 'has-file' : ''}`}>
                {fileName ? (
                  <div className="file-info">
                    <Music size={24} className="file-icon" />
                    <span>{fileName}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Upload size={24} />
                    <span>Click to upload audio (MP3, WAV)</span>
                  </div>
                )}
              </label>
              <input
                type="file"
                id="audio-upload"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden-input"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Song' : 'Add Song'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SongForm;
