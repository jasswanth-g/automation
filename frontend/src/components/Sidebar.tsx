import { NavLink } from 'react-router-dom';
import { Film, Music, Quote, Sun, Moon } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar = ({ theme, toggleTheme }: SidebarProps) => {
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
          <NavLink to="/videos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Film size={20} />
            <span>Videos</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
