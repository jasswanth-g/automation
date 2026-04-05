import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MovieList from './pages/MovieList';
import MovieDetails from './pages/MovieDetails';
import MovieForm from './pages/MovieForm';
import SongList from './pages/SongList';
import QuoteList from './pages/QuoteList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MovieList />} />
            <Route path="/songs" element={<SongList />} />
            <Route path="/quotes" element={<QuoteList />} />
            <Route path="/movie/new" element={<MovieForm />} />
            <Route path="/movie/edit/:id" element={<MovieForm />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
