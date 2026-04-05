import axios from 'axios';
import colors from 'colors';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import ImageKit from 'imagekit';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { MovieRepository } from '../repositories/movie.repository.js';
import { QuoteRepository } from '../repositories/quote.repository.js';
import { SongRepository } from '../repositories/song.repository.js';
import { VideoRepository, type VideoMetadata } from '../repositories/video.repository.js';

const streamPipeline = promisify(pipeline);

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
}

export class VideoService {
  private imagekit: ImageKit;
  private videoRepository: VideoRepository;
  private quoteRepository: QuoteRepository;
  private songRepository: SongRepository;
  private movieRepository: MovieRepository;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
    this.videoRepository = new VideoRepository();
    this.quoteRepository = new QuoteRepository();
    this.songRepository = new SongRepository();
    this.movieRepository = new MovieRepository();
  }

  async getVideoStatus(id: string): Promise<VideoMetadata | null> {
    return await this.videoRepository.findById(id);
  }

  async getAllVideos(): Promise<VideoMetadata[]> {
    return await this.videoRepository.findAll();
  }

  async generateVideo(
    quoteId: string,
    songId: string,
    style?: {
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
    }
  ): Promise<VideoMetadata> {
    // 1. Fetch metadata
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    const song = await this.songRepository.findById(songId);
    if (!song) throw new Error('Song not found');

    let imageUrl: string | undefined = 'https://ik.imagekit.io/jasswanth/test.jpg';

    const audioUrl = song.url;
    const text = quote.text;

    // 2. Create video record
    const videoData: Partial<VideoMetadata> = {
      status: 'pending',
      quote_id: quoteId,
      song_id: songId,
    };

    const videoRecord = await this.videoRepository.create(videoData);
    const videoId = videoRecord.id!;

    // 3. Start processing in background
    this.processVideo(videoId, imageUrl, audioUrl, text, quoteId, style).catch(err => {
      console.error(colors.red(`[VideoService] Background processing failed for ${videoId}:`), err);
    });

    return videoRecord;
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const video = await this.videoRepository.findById(id);
      if (!video) throw new Error('Video not found');

      // 1. Delete from ImageKit if it was successfully uploaded
      if (video.imagekit_file_id) {
        console.log(colors.yellow(`[VideoService] Deleting file from ImageKit: ${video.imagekit_file_id}`));
        try {
          await this.imagekit.deleteFile(video.imagekit_file_id);
        } catch (ikError) {
          console.warn(colors.yellow(`[VideoService] Warning: Could not delete file from ImageKit`));
        }
      }

      // 2. Update quote status if linked
      if (video.quote_id) {
        await this.quoteRepository.update(video.quote_id, { video_status: 'pending' });
      }

      // 3. Delete from database
      await this.videoRepository.delete(id);
      console.log(colors.green(`[VideoService] Successfully deleted video: ${id}`));
    } catch (error: any) {
      console.error(colors.red(`[VideoService] Deletion failed for ${id}: ${error.message}`));
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  private async processVideo(
    videoId: string,
    imageUrl: string | undefined,
    audioUrl: string,
    text: string,
    quoteId?: string,
    style?: {
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
    }
  ) {
    const tmpDir = path.join(os.tmpdir(), 'video-gen', videoId);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const imagePath = path.join(tmpDir, 'input_image.jpg');
    const audioPath = path.join(tmpDir, 'input_audio.mp3');
    const outputPath = path.join(tmpDir, 'output.mp4');

    try {
      await this.videoRepository.update(videoId, { status: 'processing' });

      console.log(colors.cyan(`[VideoService] Preparing assets for video ${videoId}...`));
      
      const tasks: Promise<void>[] = [this.downloadFile(audioUrl, audioPath)];
      
      if (imageUrl) {
        console.log(colors.cyan(`[VideoService] Downloading image for video ${videoId}...`));
        tasks.push(this.downloadFile(imageUrl, imagePath));
      } else {
        console.log(colors.cyan(`[VideoService] Using default static image for video ${videoId}...`));
        const defaultImagePath = path.join(process.cwd(), 'test.jpg');
        if (fs.existsSync(defaultImagePath)) {
          fs.copyFileSync(defaultImagePath, imagePath);
        } else {
          throw new Error(`Default static image not found at ${defaultImagePath}`);
        }
      }

      await Promise.all(tasks);

      // Use a common font path based on OS
      let fontPath = 'arial.ttf'; 
      if (process.platform === 'win32') {
        fontPath = 'C\\:/Windows/Fonts/arial.ttf';
      }

      // styling
      const fontSize = style?.fontSize || 72;
      const fontColor = style?.fontColor || 'black';
      const borderColor = style?.borderColor || 'white';
      const position = style?.position || 'middle';

      let yPos = '(h-text_h)/2'; // middle
      if (position === 'top') yPos = 'h/4';
      if (position === 'bottom') yPos = '3*h/4-text_h';

      console.log(colors.yellow(`[VideoService] Running FFmpeg for video ${videoId}...`));
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(imagePath)
          .inputOptions(['-loop 1', '-framerate 30']) // Explicitly set framerate for image input
          .input(audioPath)
          .complexFilter([
            `scale=1080:1920:force_original_aspect_ratio=decrease,
             pad=1080:1920:(ow-iw)/2:(oh-ih)/2,
             setsar=1,
             drawtext=fontfile='${fontPath}':
             text='${text.replace(/'/g, "'\\\\\\''")}':
             fontsize=${fontSize}:
             fontcolor=${fontColor}:
             line_spacing=25:
             borderw=3:
             bordercolor=${borderColor}:
             x=(w-text_w)/2:
             y=${yPos}`
          ])
          .outputOptions([
            '-c:v libx264',
            '-profile:v high',
            '-level 4.1',
            '-pix_fmt yuv420p',
            '-r 30',
            '-b:v 5000k',
            '-maxrate 5000k',
            '-bufsize 10000k',
            '-c:a aac',
            '-b:a 128k',
            '-ar 48000',
            '-ac 2',
            '-shortest',
            '-movflags +faststart',
          ])
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          });
          // Removed redundant .run() as .save() already starts the process
      });

      console.log(colors.green(`[VideoService] FFmpeg finished. Uploading to ImageKit...`));
      const fileBuffer = fs.readFileSync(outputPath);
      const uploadResponse = await this.imagekit.upload({
        file: fileBuffer,
        fileName: `video_${videoId}.mp4`,
        folder: '/generated_videos/',
      });

      await this.videoRepository.update(videoId, {
        status: 'completed',
        url: uploadResponse.url,
        imagekit_file_id: uploadResponse.fileId,
      });

      if (quoteId) {
        await this.quoteRepository.update(quoteId, { video_status: 'created' });
      }

      console.log(colors.green(`[VideoService] Video ${videoId} processing complete.`));
    } catch (error: any) {
      console.error(colors.red(`[VideoService] Error processing video ${videoId}:`), error);
      await this.videoRepository.update(videoId, {
        status: 'failed',
        error: error.message,
      });
    } finally {
      // Cleanup
      try {
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        console.warn(`[VideoService] Failed to cleanup temp dir ${tmpDir}:`, e);
      }
    }
  }

  private async downloadFile(url: string, destPath: string): Promise<void> {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
    await streamPipeline(response.data, fs.createWriteStream(destPath));
  }
}
