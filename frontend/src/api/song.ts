import api from './index';
import type { Song, CreateSongRequest, UpdateSongRequest, ApiResponse } from '../types';

export const getSongs = (movieId?: string) => {
  const url = movieId ? `/songs/movie/${movieId}` : '/songs';
  return api.get<any, ApiResponse<Song[]>>(url);
};

export const getSong = (id: string) => api.get<any, ApiResponse<Song>>(`/songs/${id}`);
export const createSong = (data: CreateSongRequest) => api.post<any, ApiResponse<Song>>('/songs', data);
export const updateSong = (id: string, data: UpdateSongRequest) => api.put<any, ApiResponse<Song>>(`/songs/${id}`, data);
export const deleteSong = (id: string) => api.delete<any, ApiResponse<void>>(`/songs/${id}`);
