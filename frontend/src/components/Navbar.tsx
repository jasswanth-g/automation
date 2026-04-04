import { Link } from 'react-router-dom';
import { Film, Plus } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Film className="navbar-icon" />
          <span>MovieManager</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="navbar-link">Movies</Link>
          <Link to="/movie/new" className="navbar-link btn-primary">
            <Plus size={18} />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
