import { Link } from 'react-router-dom';
import { Edit2, Trash2, PlayCircle } from 'lucide-react';
import type { Movie } from '../types';
import './MovieCard.css';

interface MovieCardProps {
  movie: Movie;
  onDelete: (id: string) => void;
}

const MovieCard = ({ movie, onDelete }: MovieCardProps) => {
  return (
    <div className="movie-card card">
      <div className="movie-image-container">
        <img src={movie.image_url} alt={movie.title} className="movie-image" />
        <div className="movie-overlay">
          <Link to={`/movie/${movie.id}`} className="play-btn">
            <PlayCircle size={48} />
          </Link>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-description">{movie.description || 'No description available.'}</p>
        <div className="movie-actions">
          <Link to={`/movie/edit/${movie.id}`} className="btn btn-outline btn-sm">
            <Edit2 size={16} />
            Edit
          </Link>
          <button 
            onClick={() => onDelete(movie.id)} 
            className="btn btn-danger btn-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
