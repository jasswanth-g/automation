import api from './index';
import type { Movie, CreateMovieRequest, UpdateMovieRequest, ApiResponse } from '../types';

export const getMovies = () => api.get<any, ApiResponse<Movie[]>>('/movies');
export const getMovie = (id: string) => api.get<any, ApiResponse<Movie>>(`/movies/${id}`);
export const createMovie = (data: CreateMovieRequest) => api.post<any, ApiResponse<Movie>>('/movies', data);
export const updateMovie = (id: string, data: UpdateMovieRequest) => api.put<any, ApiResponse<Movie>>(`/movies/${id}`, data);
export const deleteMovie = (id: string) => api.delete<any, ApiResponse<void>>(`/movies/${id}`);
