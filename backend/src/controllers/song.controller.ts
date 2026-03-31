import { Get, Post, Patch, Delete, Controller, Body, Param, OnUndefined, NotFoundError, Params } from 'routing-controllers';
import { SongService } from '../services/song.service.js';

const songService = new SongService();

@Controller('/api/songs')
export class SongController {
  /**
   * @openapi
   * /api/songs:
   *   post:
   *     summary: Upload a new song
   *     tags: [Songs]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               base64:
   *                 type: string
   *                 description: Raw base64 string of the audio file
   *     responses:
   *       201:
   *         description: Song uploaded successfully
   */
  @Post('/')
  async uploadSong(@Body() body: { name: string; base64: string }) {
    return await songService.uploadSong(body.name, body.base64);
  }

  /**
   * @openapi
   * /api/songs:
   *   get:
   *     summary: List all songs
   *     tags: [Songs]
   *     responses:
   *       200:
   *         description: List of songs
   */
  @Get('/')
  async getAllSongs() {
    return await songService.getAllSongs();
  }

  /**
   * @openapi
   * /api/songs/{id}:
   *   get:
   *     summary: Get song by ID
   *     tags: [Songs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Song details
   *       404:
   *         description: Song not found
   */
  @Get('/:id')
  @OnUndefined(404)
  async getSongById(@Param('id') id: string) {
    const song = await songService.getSongById(id);
    if (!song) throw new NotFoundError('Song not found');
    return song;
  }

  /**
   * @openapi
   * /api/songs/{id}:
   *   patch:
   *     summary: Update song
   *     tags: [Songs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               base64:
   *                 type: string
   *     responses:
   *       200:
   *         description: Song updated
   */
  @Patch('/:id')
  async updateSong(@Param('id') id: string, @Body() body: { name?: string; base64?: string }) {
    return await songService.updateSong(id, body.name, body.base64);
  }

  /**
   * @openapi
   * /api/songs/{id}:
   *   delete:
   *     summary: Delete song
   *     tags: [Songs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Song deleted
   */
  @Delete('/:id')
  @OnUndefined(204)
  async deleteSong(@Param('id') id: string) {
    await songService.deleteSong(id);
  }
}
