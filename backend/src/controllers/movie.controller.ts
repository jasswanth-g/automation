import { Get, Post, Patch, Delete, Controller, Body, Param, OnUndefined, NotFoundError } from 'routing-controllers';
import { Service } from 'typedi';
import { MovieService } from '../services/movie.service.js';
import { CreateMovieDto, UpdateMovieDto } from '../dtos/movie.dto.js';

const movieService = new MovieService();

@Service()
@Controller('/api/movies')
export class MovieController {
  /**
   * @openapi
   * /api/movies:
   *   post:
   *     summary: Create a new movie
   *     tags: [Movies]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateMovieDto'
   *     responses:
   *       201:
   *         description: Movie created successfully
   */
  @Post('/')
  async createMovie(@Body() body: CreateMovieDto) {
    return await movieService.createMovie(body.title, body.description || '', body.image_base64);
  }

  /**
   * @openapi
   * /api/movies:
   *   get:
   *     summary: List all movies
   *     tags: [Movies]
   *     responses:
   *       200:
   *         description: List of movies
   */
  @Get('/')
  async getAllMovies() {
    return await movieService.getAllMovies();
  }

  /**
   * @openapi
   * /api/movies/{id}:
   *   get:
   *     summary: Get movie by ID with its songs
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Movie details and songs
   *       404:
   *         description: Movie not found
   */
  @Get('/:id')
  @OnUndefined(404)
  async getMovieById(@Param('id') id: string) {
    const movie = await movieService.getMovieById(id);
    if (!movie) throw new NotFoundError('Movie not found');
    return movie;
  }

  /**
   * @openapi
   * /api/movies/{id}:
   *   patch:
   *     summary: Update movie
   *     tags: [Movies]
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
   *             $ref: '#/components/schemas/UpdateMovieDto'
   *     responses:
   *       200:
   *         description: Movie updated
   */
  @Patch('/:id')
  async updateMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return await movieService.updateMovie(id, body.title, body.description, body.image_base64);
  }

  /**
   * @openapi
   * /api/movies/{id}:
   *   delete:
   *     summary: Delete movie and its assets
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Movie deleted
   */
  @Delete('/:id')
  @OnUndefined(204)
  async deleteMovie(@Param('id') id: string) {
    await movieService.deleteMovie(id);
  }
}
