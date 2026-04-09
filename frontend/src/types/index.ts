export interface Movie {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  imagekit_file_id: string;
  songs?: Song[];
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  movie_id?: string;
  name: string;
  url: string;
  imagekit_file_id: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMovieRequest {
  title: string;
  description?: string;
  image_base64: string;
}

export interface UpdateMovieRequest {
  title?: string;
  description?: string;
  image_base64?: string;
}

export interface CreateSongRequest {
  name: string;
  movie_id?: string;
  base64: string;
}

export interface UpdateSongRequest {
  name?: string;
  movie_id?: string;
  base64?: string;
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  category?: string;
  source?: string;
  status: 'created' | 'posted';
  video_status: 'pending' | 'created';
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteRequest {
  text: string;
  author?: string;
  category?: string;
  source?: string;
}

export interface UpdateQuoteRequest {
  text?: string;
  author?: string;
  category?: string;
  status?: 'created' | 'posted';
  video_status?: 'pending' | 'created';
}

export interface VideoStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  quote_id?: string;
  song_id?: string;
  created_at: string;
}
export interface GenerateVideoRequest {
  quote_id: string;
  song_id: string;
  text?: string;
  font_size?: number;

  font_color?: string;
  border_color?: string;
  position?: 'top' | 'middle' | 'bottom';
  text_align?: 'left' | 'center' | 'right';
  aspect_ratio?: '9:16' | '16:9';
  audio_start_time?: number;
  audio_end_time?: number;
  line_height?: number;
  text_padding?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
