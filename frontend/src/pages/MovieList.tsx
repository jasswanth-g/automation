import { useState, useEffect } from 'react';
import { getMovies, deleteMovie } from '../api/movie';
import type { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { Loader2, Film } from 'lucide-react';
import './MovieList.css';

const MovieList = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await getMovies();
      setMovies(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie? This will also delete all associated songs.')) {
      try {
        await deleteMovie(id);
        setMovies(movies.filter(movie => movie.id !== id));
      } catch (err) {
        alert('Failed to delete movie.');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading movies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={fetchMovies} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="movie-list-page">
      <header className="page-header">
        <h1>Movies</h1>
        <p className="subtitle">Manage your movie collection and songs.</p>
      </header>

      {movies.length === 0 ? (
        <div className="empty-state">
          <Film size={64} />
          <h3>No movies found</h3>
          <p>Start by adding a new movie to your collection.</p>
        </div>
      ) : (
        <div className="grid">
          {movies.map(movie => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieList;
