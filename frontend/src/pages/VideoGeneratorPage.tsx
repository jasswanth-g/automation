import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote } from '../api/quote';
import type { Quote } from '../types';
import VideoGenerator from '../components/VideoGenerator';
import { Loader2 } from 'lucide-react';

const VideoGeneratorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuote(id);
    }
  }, [id]);

  const fetchQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const response = await getQuote(quoteId);
      setQuote(response.data);
    } catch (err) {
      setError('Failed to fetch quote details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/quotes');
  };

  const handleSuccess = () => {
    navigate('/videos');
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading quote details...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="error-state">
        <p>{error || 'Quote not found'}</p>
        <button onClick={handleBack} className="btn btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="video-generator-page-container">
      <VideoGenerator 
        quote={quote} 
        onClose={handleBack} 
        onSuccess={handleSuccess}
        isPage={true}
      />
    </div>
  );
};

export default VideoGeneratorPage;
