import ImageKit from 'imagekit';
import { MovieRepository } from '../repositories/movie.repository.js';
import type { MovieMetadata } from '../repositories/movie.repository.js';
import { SongRepository } from '../repositories/song.repository.js';
import config from '../config/config.json' with { type: 'json' };
import colors from 'colors';
import { cleanBase64, isValidBase64 } from '../utils/base64.util.js';

export class MovieService {
  private imagekit: ImageKit;
  private movieRepository: MovieRepository;
  private songRepository: SongRepository;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint,
    });
    this.movieRepository = new MovieRepository();
    this.songRepository = new SongRepository();
  }

  async createMovie(title: string, description: string, imageBase64: string): Promise<MovieMetadata> {
    try {
      console.log(colors.cyan(`[MovieService] Creating movie: ${title}`));
      
      if (!isValidBase64(imageBase64)) {
        throw new Error('Invalid Base64 string for image');
      }

      const cleanedBase64 = cleanBase64(imageBase64);
      const buffer = Buffer.from(cleanedBase64, 'base64');
      if (buffer.length === 0) throw new Error('Decoded buffer is empty');

      console.log(colors.yellow(`[MovieService] Uploading cover to ImageKit...`));
      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `${title.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
        folder: '/movies/',
      });
      console.log(colors.green(`[MovieService] ImageKit upload successful: ${uploadResponse.fileId}`));

      const result = await this.movieRepository.create({
        title,
        description,
        image_url: uploadResponse.url,
        imagekit_file_id: uploadResponse.fileId,
      });
      
      console.log(colors.green(`[MovieService] Successfully created movie: ${result.id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[MovieService] Creation failed: ${error.message}`));
      throw new Error(`Failed to create movie: ${error.message}`);
    }
  }

  async getAllMovies(): Promise<MovieMetadata[]> {
    try {
      return await this.movieRepository.findAll();
    } catch (error: any) {
      console.error(colors.red(`[MovieService] Failed to fetch movies: ${error.message}`));
      throw new Error(`Failed to retrieve movies: ${error.message}`);
    }
  }

  async getMovieById(id: string): Promise<MovieMetadata & { songs: any[] }> {
    try {
      const movie = await this.movieRepository.findById(id);
      if (!movie) throw new Error('Movie not found');
      
      const songs = await this.songRepository.findByMovieId(id);
      return { ...movie, songs };
    } catch (error: any) {
      console.error(colors.red(`[MovieService] Failed to find movie ${id}: ${error.message}`));
      throw new Error(`Failed to find movie: ${error.message}`);
    }
  }

  async updateMovie(id: string, title?: string, description?: string, imageBase64?: string): Promise<MovieMetadata> {
    try {
      const existingMovie = await this.movieRepository.findById(id);
      if (!existingMovie) throw new Error('Movie not found');

      let updates: Partial<MovieMetadata> = {};
      if (title) updates.title = title;
      if (description) updates.description = description;

      if (imageBase64) {
        if (!isValidBase64(imageBase64)) {
          throw new Error('Invalid Base64 string for image');
        }

        const cleanedBase64 = cleanBase64(imageBase64);
        console.log(colors.yellow(`[MovieService] Replacing cover in ImageKit...`));
        try {
          await this.imagekit.deleteFile(existingMovie.imagekit_file_id);
        } catch (delError) {
          console.warn(colors.yellow(`[MovieService] Warning: Could not delete old file from ImageKit`));
        }

        const buffer = Buffer.from(cleanedBase64, 'base64');
        const uploadResponse = await this.imagekit.upload({
          file: buffer,
          fileName: `${(title || existingMovie.title).replace(/\s+/g, '_')}_${Date.now()}.jpg`,
          folder: '/movies/',
        });

        updates.image_url = uploadResponse.url;
        updates.imagekit_file_id = uploadResponse.fileId;
      }

      const result = await this.movieRepository.update(id, updates);
      console.log(colors.green(`[MovieService] Successfully updated movie: ${id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[MovieService] Update failed for ${id}: ${error.message}`));
      throw new Error(`Failed to update movie: ${error.message}`);
    }
  }

  async deleteMovie(id: string): Promise<void> {
    try {
      const movie = await this.movieRepository.findById(id);
      if (movie) {
        // First delete all songs associated with this movie
        const songs = await this.songRepository.findByMovieId(id);
        for (const song of songs) {
          try {
            await this.imagekit.deleteFile(song.imagekit_file_id);
          } catch (e) {}
          // Note: songs will be deleted from DB via cascade if configured, 
          // but we might want to delete them explicitly if not.
          // For now, let's assume cascade or handle here if needed.
        }

        console.log(colors.yellow(`[MovieService] Deleting cover from ImageKit: ${movie.imagekit_file_id}`));
        await this.imagekit.deleteFile(movie.imagekit_file_id);
      }
      
      await this.movieRepository.delete(id);
      console.log(colors.green(`[MovieService] Successfully deleted movie: ${id}`));
    } catch (error: any) {
      console.error(colors.red(`[MovieService] Deletion failed for ${id}: ${error.message}`));
      throw new Error(`Failed to delete movie: ${error.message}`);
    }
  }
}
