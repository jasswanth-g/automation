export interface Movie {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  imagekit_file_id: string;
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
