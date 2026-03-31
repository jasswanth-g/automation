import { VideoRepository } from '../repositories/video.repository.js';

const videoRepo = new VideoRepository();

export class VideoService {
  async getHello() {
    return await videoRepo.getHello();
  }
}
