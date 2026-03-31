import ImageKit from 'imagekit';
import { SongRepository } from '../repositories/song.repository.js';
import type { SongMetadata } from '../repositories/song.repository.js';
import config from '../config/config.json' with { type: 'json' };
import colors from 'colors';

export class SongService {
  private imagekit: ImageKit;
  private repository: SongRepository;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint,
    });
    this.repository = new SongRepository();
  }

  async uploadSong(name: string, base64: string): Promise<SongMetadata> {
    try {
      console.log(colors.cyan(`[SongService] Starting upload for: ${name}`));
      
      // 1. Decode base64 to buffer
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length === 0) throw new Error('Invalid or empty Base64 string');

      // 2. Upload to ImageKit
      console.log(colors.yellow(`[SongService] Uploading to ImageKit...`));
      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `${name.replace(/\s+/g, '_')}_${Date.now()}.mp3`,
        folder: '/songs/',
      });
      console.log(colors.green(`[SongService] ImageKit upload successful: ${uploadResponse.fileId}`));

      // 3. Store in Supabase
      console.log(colors.yellow(`[SongService] Storing metadata in Supabase...`));
      const result = await this.repository.create({
        name,
        url: uploadResponse.url,
        imagekit_file_id: uploadResponse.fileId,
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

  async getSongById(id: string): Promise<SongMetadata | null> {
    try {
      return await this.repository.findById(id);
    } catch (error: any) {
      console.error(colors.red(`[SongService] Failed to find song ${id}: ${error.message}`));
      throw new Error(`Failed to find song: ${error.message}`);
    }
  }

  async updateSong(id: string, name?: string, base64?: string): Promise<SongMetadata> {
    try {
      const existingSong = await this.repository.findById(id);
      if (!existingSong) throw new Error('Song not found in database');

      let updates: Partial<SongMetadata> = {};
      if (name) updates.name = name;

      if (base64) {
        console.log(colors.yellow(`[SongService] Replacing file in ImageKit...`));
        // Delete old file
        try {
          await this.imagekit.deleteFile(existingSong.imagekit_file_id);
        } catch (delError) {
          console.warn(colors.yellow(`[SongService] Warning: Could not delete old file from ImageKit (it may have been deleted already)`));
        }

        // Upload new file
        const buffer = Buffer.from(base64, 'base64');
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
