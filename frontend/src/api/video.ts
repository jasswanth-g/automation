import api from './index';
import type { VideoStatus, GenerateVideoRequest, ApiResponse } from '../types';

export const generateVideo = (data: GenerateVideoRequest) => 
  api.post<any, ApiResponse<VideoStatus>>('/videos/generate', data);

export const getVideoStatus = (id: string) => 
  api.get<any, ApiResponse<VideoStatus>>(`/videos/status/${id}`);
