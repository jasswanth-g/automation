import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMovie, createMovie, updateMovie } from '../api/movie';
import { fileToBase64 } from '../utils/base64';
import { Loader2, ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';
import './MovieForm.css';

const MovieForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_base64: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      fetchMovie(id);
    }
  }, [isEdit, id]);

  const fetchMovie = async (movieId: string) => {
    try {
      setFetching(true);
      const response = await getMovie(movieId);
      const movie = response.data;
      setFormData({
        title: movie.title,
        description: movie.description || '',
        image_base64: '', // We don't have the base64 of the existing image, and we only send it if changed
      });
      setImagePreview(movie.image_url);
    } catch (err) {
      setError('Failed to fetch movie details.');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, image_base64: base64 }));
        
        // For preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        alert('Failed to process image.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title) {
      setError('Title is required.');
      return;
    }

    if (!isEdit && !formData.image_base64) {
      setError('Image is required for new movies.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        // Only send image_base64 if it was updated
        const updateData: any = {
          title: formData.title,
          description: formData.description,
        };
        if (formData.image_base64) {
          updateData.image_base64 = formData.image_base64;
        }
        await updateMovie(id, updateData);
      } else {
        await createMovie(formData);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save movie.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading movie details...</p>
      </div>
    );
  }

  return (
    <div className="movie-form-page">
      <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="form-card card">
        <header className="form-header">
          <h2>{isEdit ? 'Edit Movie' : 'Add New Movie'}</h2>
          <p>{isEdit ? 'Update movie details and cover image.' : 'Enter the details for your new movie.'}</p>
        </header>

        <form onSubmit={handleSubmit} className="movie-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Movie Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Inception"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter a brief summary of the movie..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Cover Image {!isEdit && '*'}</label>
            <div className="image-upload-container">
              {imagePreview ? (
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <label htmlFor="image-upload" className="change-image-btn">
                    <Upload size={16} />
                    Change Image
                  </label>
                </div>
              ) : (
                <label htmlFor="image-upload" className="image-placeholder">
                  <ImageIcon size={48} />
                  <span>Click to upload movie cover</span>
                  <span className="file-hint">PNG, JPG or WEBP (Max 5MB)</span>
                </label>
              )}
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
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
                isEdit ? 'Update Movie' : 'Create Movie'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovieForm;
