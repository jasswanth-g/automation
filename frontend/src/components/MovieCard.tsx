import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, PlayCircle, MoreVertical } from 'lucide-react';
import type { Movie } from '../types';
import './MovieCard.css';

interface MovieCardProps {
  movie: Movie;
  onDelete: (id: string) => void;
}

const MovieCard = ({ movie, onDelete }: MovieCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className={`movie-card card ${showMenu ? 'menu-open' : ''}`}>
      <div className="movie-image-container">
        <img src={movie.image_url} alt={movie.title} className="movie-image" />
        <div className="movie-overlay">
          <Link to={`/movie/${movie.id}`} className="play-btn">
            <PlayCircle size={48} />
          </Link>
        </div>
      </div>
      <div className="movie-info">
        <div className="movie-header">
          <h3 className="movie-title">{movie.title}</h3>
          <div className="movie-menu-container" ref={menuRef}>
            <button 
              className="menu-toggle-btn" 
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="movie-dropdown">
                <Link to={`/movie/edit/${movie.id}`} className="dropdown-item">
                  <Edit2 size={16} />
                  <span>Edit</span>
                </Link>
                <button 
                  onClick={() => {
                    onDelete(movie.id);
                    setShowMenu(false);
                  }} 
                  className="dropdown-item danger"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* <p className="movie-description">{movie.description || 'No description available.'}</p> */}
      </div>
    </div>
  );
};

export default MovieCard;
