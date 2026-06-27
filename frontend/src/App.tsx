import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MovieList from './pages/MovieList';
import MovieDetails from './pages/MovieDetails';
import MovieForm from './pages/MovieForm';
import QuoteList from './pages/QuoteList';
import SongList from './pages/SongList';
import VideoList from './pages/VideoList';
import VideoGeneratorPage from './pages/VideoGeneratorPage';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MovieList />} />
            <Route path="/songs" element={<SongList />} />
            <Route path="/quotes" element={<QuoteList />} />
            <Route path="/videos" element={<VideoList />} />
            <Route path="/video/generate/:id" element={<VideoGeneratorPage />} />
            <Route path="/movie/new" element={<MovieForm />} />
...

            <Route path="/movie/edit/:id" element={<MovieForm />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
