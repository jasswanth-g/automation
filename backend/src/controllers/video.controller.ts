import { Get, Controller } from 'routing-controllers';
import { VideoService } from '../services/video.service.js';

const videoService = new VideoService();

@Controller('/api')
export class VideoController {
  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health Check
   *     tags:
   *       - General
   *     description: Returns the server health status
   *     responses:
   *       200:
   *         description: Success
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   */
  @Get('/health')
  getHealth() {
    return 'Server is running';
  }
}
