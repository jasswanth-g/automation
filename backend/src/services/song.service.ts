import fs from 'fs';
import path from 'path';
import ImageKit from 'imagekit';
import { SongRepository } from '../repositories/song.repository.js';
import type { SongMetadata } from '../repositories/song.repository.js';
import colors from 'colors';
import { cleanBase64, isValidBase64 } from '../utils/base64.util.js';

export class SongService {
  private imagekit: ImageKit;
  private repository: SongRepository;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
    this.repository = new SongRepository();
  }

  private saveSongLocally(buffer: Buffer, fileName: string): string {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'songs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    const port = process.env.PORT || 3000;
    const baseUrl = process.env.APP_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/songs/${fileName}`;
  }

  async uploadSong(name: string, base64: string, movie_id?: string): Promise<SongMetadata> {
    try {
      console.log(colors.cyan(`[SongService] Starting upload for: ${name}`));
      
      if (!isValidBase64(base64)) {
        throw new Error('Invalid Base64 string for audio');
      }

      const cleanedBase64 = cleanBase64(base64);
      const buffer = Buffer.from(cleanedBase64, 'base64');
      if (buffer.length === 0) throw new Error('Invalid or empty Base64 string');

      let audioUrl = '';
      let fileId = `local_${Date.now()}`;
      const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.mp3`;

      if (process.env.USE_LOCAL_STORAGE !== 'true' && process.env.IMAGEKIT_PUBLIC_KEY) {
        try {
          console.log(colors.yellow(`[SongService] Uploading to ImageKit...`));
          const uploadResponse = await this.imagekit.upload({
            file: buffer,
            fileName,
            folder: '/songs/',
          });
          audioUrl = uploadResponse.url;
          fileId = uploadResponse.fileId;
          console.log(colors.green(`[SongService] ImageKit upload successful: ${uploadResponse.fileId}`));
        } catch (ikError: any) {
          console.warn(colors.yellow(`[SongService] ImageKit failed, saving locally: ${ikError.message}`));
          audioUrl = this.saveSongLocally(buffer, fileName);
        }
      } else {
        console.log(colors.yellow(`[SongService] Using local file storage...`));
        audioUrl = this.saveSongLocally(buffer, fileName);
      }

      console.log(colors.yellow(`[SongService] Storing metadata...`));
      const result = await this.repository.create({
        name,
        movie_id,
        url: audioUrl,
        imagekit_file_id: fileId,
      });
      
      console.log(colors.green(`[SongService] Successfully processed song: ${result.id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[SongService] Upload failed: ${error.message}`));
      throw new Error(`Failed to upload song: ${error.message}`);
    }
  }

  async getAllSongs(): Promise<SongMetadata[]> {
    try {
      return await this.repository.findAll();
    } catch (error: any) {
      console.error(colors.red(`[SongService] Failed to fetch songs: ${error.message}`));
      throw new Error(`Failed to retrieve songs: ${error.message}`);
    }
  }

  async getSongsByMovieId(movieId: string): Promise<SongMetadata[]> {
    try {
      return await this.repository.findByMovieId(movieId);
    } catch (error: any) {
      console.error(colors.red(`[SongService] Failed to fetch songs for movie ${movieId}: ${error.message}`));
      throw new Error(`Failed to retrieve songs for movie: ${error.message}`);
    }
  }

  async getSongById(id: string): Promise<SongMetadata | null> {
    try {
      return await this.repository.findById(id);
    } catch (error: any) {
      console.error(colors.red(`[SongService] Failed to find song ${id}: ${error.message}`));
      throw new Error(`Failed to find song: ${error.message}`);
    }
  }

  async updateSong(id: string, name?: string, base64?: string, movie_id?: string): Promise<SongMetadata> {
    try {
      const existingSong = await this.repository.findById(id);
      if (!existingSong) throw new Error('Song not found in database');

      let updates: Partial<SongMetadata> = {};
      if (name) updates.name = name;
      if (movie_id) updates.movie_id = movie_id;

      if (base64) {
        if (!isValidBase64(base64)) {
          throw new Error('Invalid Base64 string for audio');
        }

        const cleanedBase64 = cleanBase64(base64);
        console.log(colors.yellow(`[SongService] Replacing file in ImageKit...`));
        // Delete old file
        try {
          await this.imagekit.deleteFile(existingSong.imagekit_file_id);
        } catch (delError) {
          console.warn(colors.yellow(`[SongService] Warning: Could not delete old file from ImageKit (it may have been deleted already)`));
        }

        // Upload new file
        const buffer = Buffer.from(cleanedBase64, 'base64');
        const uploadResponse = await this.imagekit.upload({
          file: buffer,
          fileName: `${(name || existingSong.name).replace(/\s+/g, '_')}_${Date.now()}.mp3`,
          folder: '/songs/',
        });

        updates.url = uploadResponse.url;
        updates.imagekit_file_id = uploadResponse.fileId;
      }

      const result = await this.repository.update(id, updates);
      console.log(colors.green(`[SongService] Successfully updated song: ${id}`));
      return result;
    } catch (error: any) {
      console.error(colors.red(`[SongService] Update failed for ${id}: ${error.message}`));
      throw new Error(`Failed to update song: ${error.message}`);
    }
  }

  async deleteSong(id: string): Promise<void> {
    try {
      const song = await this.repository.findById(id);
      if (song) {
        console.log(colors.yellow(`[SongService] Deleting file from ImageKit: ${song.imagekit_file_id}`));
        await this.imagekit.deleteFile(song.imagekit_file_id);
      }
      
      await this.repository.delete(id);
      console.log(colors.green(`[SongService] Successfully deleted song: ${id}`));
    } catch (error: any) {
      console.error(colors.red(`[SongService] Deletion failed for ${id}: ${error.message}`));
      throw new Error(`Failed to delete song: ${error.message}`);
    }
  }
}
