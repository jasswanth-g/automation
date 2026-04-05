import { useState } from 'react';
import { createQuote, updateQuote } from '../api/quote';
import type { Quote } from '../types';
import { Loader2, X, Quote as QuoteIcon } from 'lucide-react';
import './QuoteForm.css';

interface QuoteFormProps {
  quote: Quote | null;
  onClose: () => void;
  onSuccess: () => void;
}

const QuoteForm = ({ quote, onClose, onSuccess }: QuoteFormProps) => {
  const isEdit = Boolean(quote);
  const [formData, setFormData] = useState({
    text: quote?.text || '',
    author: quote?.author || '',
    category: quote?.category || '',
    source: quote?.source || '',
    status: quote?.status || 'created',
    video_status: quote?.video_status || 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.text) {
      setError('Quote text is required.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && quote) {
        await updateQuote(quote.id, formData as any);
      } else {
        await createQuote({
          text: formData.text,
          author: formData.author || undefined,
          category: formData.category || undefined,
          source: formData.source || undefined,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save quote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-with-icon">
            <QuoteIcon size={20} className="text-primary" />
            <h3>{isEdit ? 'Edit Quote' : 'Add New Quote'}</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="quote-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="quote-text">Quote Text *</label>
            <textarea
              id="quote-text"
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              placeholder="Enter the quote text here..."
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quote-author">Author</label>
              <input
                type="text"
                id="quote-author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="e.g. Albert Einstein"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quote-category">Category</label>
              <input
                type="text"
                id="quote-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g. Inspirational"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="quote-source">Source</label>
            <input
              type="text"
              id="quote-source"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder="e.g. BrainyQuote, Book Title"
            />
          </div>

          {isEdit && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quote-status">Status</label>
                <select
                  id="quote-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="created">Created</option>
                  <option value="posted">Posted</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quote-video-status">Video Status</label>
                <select
                  id="quote-video-status"
                  name="video_status"
                  value={formData.video_status}
                  onChange={handleInputChange}
                >
                  <option value="pending">Pending</option>
                  <option value="created">Created</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Quote' : 'Add Quote'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
