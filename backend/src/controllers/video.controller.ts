import { Get, Post, Delete, Controller, Body, Param, NotFoundError, OnUndefined } from 'routing-controllers';
import { Service } from 'typedi';
import { VideoService } from '../services/video.service.js';
import { GenerateVideoDto } from '../dtos/video.dto.js';

const videoService = new VideoService();

@Service()
@Controller('/api/videos')
export class VideoController {
  /**
   * @openapi
   * /api/videos/generate:
   *   post:
   *     summary: Generate a video from a quote and song
   *     tags: [Videos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GenerateVideoDto'
   *     responses:
   *       202:
   *         description: Video generation started
   */
  @Post('/generate')
  @OnUndefined(202)
  async generateVideo(@Body() body: GenerateVideoDto) {
    return await videoService.generateVideo(
      body.quote_id,
      body.song_id,
      {
        text: body.text,
        fontSize: body.font_size,
        fontColor: body.font_color,
        borderColor: body.border_color,
        position: body.position,
        aspectRatio: body.aspect_ratio
      }
    );
  }

  /**
   * @openapi
   * /api/videos:
   *   get:
   *     summary: List all generated videos
   *     tags: [Videos]
   *     responses:
   *       200:
   *         description: List of videos
   */
  @Get('/')
  async getAllVideos() {
    return await videoService.getAllVideos();
  }

  /**
   * @openapi
   * /api/videos/status/{id}:
   *   get:
   *     summary: Get video generation status
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Video status details
   *       404:
   *         description: Video job not found
   */
  @Get('/status/:id')
  async getStatus(@Param('id') id: string) {
    const status = await videoService.getVideoStatus(id);
    if (!status) throw new NotFoundError('Video job not found');
    return status;
  }

  /**
   * @openapi
   * /api/videos/{id}:
   *   delete:
   *     summary: Delete a generated video
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Video deleted
   *       404:
   *         description: Video not found
   */
  @Delete('/:id')
  @OnUndefined(204)
  async deleteVideo(@Param('id') id: string) {
    await videoService.deleteVideo(id);
  }
}
