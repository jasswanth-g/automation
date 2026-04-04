import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MovieList from './pages/MovieList';
import MovieDetails from './pages/MovieDetails';
import MovieForm from './pages/MovieForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MovieList />} />
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
