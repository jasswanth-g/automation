import { NavLink } from 'react-router-dom';
import { Film, Music, Quote, Video } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Film className="sidebar-icon" />
        <span className="sidebar-brand">MovieManager</span>
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          <p className="sidebar-nav-title">Menu</p>
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Film size={20} />
            <span>Movies</span>
          </NavLink>
          <NavLink to="/songs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Music size={20} />
            <span>Songs</span>
          </NavLink>
          <NavLink to="/quotes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Quote size={20} />
            <span>Quotes</span>
          </NavLink>
          <NavLink to="/studio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Video size={20} />
            <span>Video Studio</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
