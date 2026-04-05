import { useState, useEffect } from 'react';
import { getQuotes, deleteQuote } from '../api/quote';
import type { Quote } from '../types';
import QuoteForm from '../components/QuoteForm';
import VideoGenerator from '../components/VideoGenerator';
import { Loader2, Quote as QuoteIcon, Trash2, Edit, Plus, Filter, CheckCircle2, Clock, Video } from 'lucide-react';
import './QuoteList.css';

const QuoteList = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [filter, setFilter] = useState<{ status?: string; video_status?: string }>({});
  
  const [selectedQuoteForVideo, setSelectedQuoteForVideo] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await getQuotes(filter);
      setQuotes(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch quotes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuote = () => {
    setEditingQuote(null);
    setIsModalOpen(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteQuote(id);
        setQuotes(quotes.filter(q => q.id !== id));
      } catch (err) {
        alert('Failed to delete quote.');
      }
    }
  };

  const handleSuccess = () => {
    fetchQuotes();
    setIsModalOpen(false);
  };

  const handleVideoSuccess = () => {
    fetchQuotes();
    setSelectedQuoteForVideo(null);
  };

  if (loading && quotes.length === 0) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading quotes...</p>
      </div>
    );
  }

  return (
    <div className="quote-list-page">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Quotes</h1>
            <p className="subtitle">Manage your collection of inspirational quotes.</p>
          </div>
          <button onClick={handleAddQuote} className="btn btn-primary">
            <Plus size={20} />
            <span>Add Quote</span>
          </button>
        </div>
      </header>

      <div className="filter-bar card">
        <div className="filter-group">
          <Filter size={18} />
          <span>Filter by:</span>
          <select 
            value={filter.status || ''} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          >
            <option value="">All Status</option>
            <option value="created">Created</option>
            <option value="posted">Posted</option>
          </select>

          <select 
            value={filter.video_status || ''} 
            onChange={(e) => setFilter({ ...filter, video_status: e.target.value || undefined })}
          >
            <option value="">All Video Status</option>
            <option value="pending">Pending</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchQuotes} className="btn btn-primary">Try Again</button>
        </div>
      )}

      {quotes.length === 0 && !loading ? (
        <div className="empty-state">
          <QuoteIcon size={64} />
          <h3>No quotes found</h3>
          <p>Start by adding a new quote to your collection.</p>
          <button onClick={handleAddQuote} className="btn btn-primary">
            <Plus size={20} />
            <span>Add your first quote</span>
          </button>
        </div>
      ) : (
        <div className="quote-grid">
          {quotes.map((quote) => (
            <div key={quote.id} className="quote-card card">
              <div className="quote-content">
                <QuoteIcon className="quote-icon-top" size={24} />
                <p className="quote-text">{quote.text}</p>
                {quote.author && <p className="quote-author">— {quote.author}</p>}
              </div>
              
              <div className="quote-footer">
                <div className="quote-meta">
                  {quote.category && <span className="category-badge">{quote.category}</span>}
                  <div className="status-indicators">
                    <span className={`status-badge ${quote.status}`} title={`Status: ${quote.status}`}>
                      {quote.status === 'posted' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {quote.status}
                    </span>
                    <span className={`status-badge video-${quote.video_status}`} title={`Video: ${quote.video_status}`}>
                      {quote.video_status === 'created' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      Video: {quote.video_status}
                    </span>
                  </div>
                  {quote.video_status === 'created' && quote.video_url && (
                    <div className="mt-2">
                      <a 
                        href={quote.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 font-semibold"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <Video size={14} />
                        <span>Open Generated Video</span>
                      </a>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedQuoteForVideo(quote)} 
                    className="btn btn-outline btn-sm mt-2"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    <Video size={14} />
                    {quote.video_status === 'created' ? 'Regenerate Video' : 'Generate Video'}
                  </button>
                </div>
                
                <div className="quote-actions">
                  <button onClick={() => handleEditQuote(quote)} className="icon-btn" title="Edit Quote">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(quote.id)} className="icon-btn danger" title="Delete Quote">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <QuoteForm 
          quote={editingQuote}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedQuoteForVideo && (
        <VideoGenerator 
          quote={selectedQuoteForVideo}
          onClose={() => setSelectedQuoteForVideo(null)}
          onSuccess={handleVideoSuccess}
        />
      )}
    </div>
  );
};

export default QuoteList;
