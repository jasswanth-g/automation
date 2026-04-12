import axios from 'axios';
import api from './index';
import type { Quote, CreateQuoteRequest, UpdateQuoteRequest, ApiResponse } from '../types';

export const getQuotes = (params?: { status?: string; video_status?: string }) => 
  api.get<any, ApiResponse<Quote[]>>('/quotes', { params });

export const getQuote = (id: string) => 
  api.get<any, ApiResponse<Quote>>(`/quotes/${id}`);

export const createQuote = (data: CreateQuoteRequest) => 
  api.post<any, ApiResponse<Quote>>('/quotes', data);

export const updateQuote = (id: string, data: UpdateQuoteRequest) => 
  api.patch<any, ApiResponse<Quote>>(`/quotes/${id}`, data);

export const deleteQuote = (id: string) => 
  api.delete<any, ApiResponse<void>>(`/quotes/${id}`);

export const generateQuote = () => {
  const url = import.meta.env.VITE_GENERATE_QUOTE_API_URL;
  if (!url) return Promise.resolve();
  return axios.get(url);
};
