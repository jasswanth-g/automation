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
      text?: string | undefined;
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
      aspectRatio?: '9:16' | '16:9' | undefined;
    }
  ): Promise<VideoMetadata> {
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) throw new Error('Quote not found');

    const song = await this.songRepository.findById(songId);
    if (!song) throw new Error('Song not found');

    let imageUrl: string | undefined = 'https://ik.imagekit.io/jasswanth/test.jpg';
    const audioUrl = song.url;
    const text = quote.text;

    const videoData: Partial<VideoMetadata> = {
      status: 'pending',
      quote_id: quoteId,
      song_id: songId,
    };

    const videoRecord = await this.videoRepository.create(videoData);
    const videoId = videoRecord.id!;

    this.processVideo(videoId, imageUrl, audioUrl, text, quoteId, style).catch(err => {
      console.error(colors.red(`[VideoService] Background processing failed for ${videoId}:`), err);
    });

    return videoRecord;
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const video = await this.videoRepository.findById(id);
      if (!video) throw new Error('Video not found');

      if (video.imagekit_file_id) {
        try {
          await this.imagekit.deleteFile(video.imagekit_file_id);
        } catch (ikError) {
          console.warn(colors.yellow(`[VideoService] Warning: Could not delete file from ImageKit`));
        }
      }

      if (video.quote_id) {
        await this.quoteRepository.update(video.quote_id, { video_status: 'pending' });
      }

      await this.videoRepository.delete(id);
    } catch (error: any) {
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  private wrapText(text: string, maxChars: number): string {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    lines.push(currentLine);
    return lines.join('\n');
  }

  private async processVideo(
    videoId: string,
    imageUrl: string | undefined,
    audioUrl: string,
    text: string,
    quoteId?: string,
    style?: {
      text?: string | undefined;
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
      aspectRatio?: '9:16' | '16:9' | undefined;
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
      
      const tasks: Promise<void>[] = [this.downloadFile(audioUrl, audioPath)];
      
      if (imageUrl) {
        tasks.push(this.downloadFile(imageUrl, imagePath));
      } else {
        const defaultImagePath = path.join(process.cwd(), 'test.jpg');
        if (fs.existsSync(defaultImagePath)) {
          fs.copyFileSync(defaultImagePath, imagePath);
        } else {
          throw new Error(`Default static image not found at ${defaultImagePath}`);
        }
      }

      await Promise.all(tasks);

      let fontPath = 'arialbd.ttf'; 
      if (process.platform === 'win32') {
        fontPath = 'C\\\\:/Windows/Fonts/arialbd.ttf';
      } else {
        // Common paths on Linux (Render/Ubuntu)
        const possibleFonts = [
          '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
          '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
          'arialbd.ttf'
        ];
        for (const f of possibleFonts) {
          if (fs.existsSync(f)) {
            fontPath = f;
            break;
          }
        }
      }

      const fontSize = style?.fontSize || 86;
      let fontColor = style?.fontColor || 'white';
      if (fontColor.startsWith('#')) {
        fontColor = fontColor.replace('#', '0x');
      }
      
      let borderColor = style?.borderColor || 'black';
      if (borderColor.startsWith('#')) {
        borderColor = borderColor.replace('#', '0x');
      }

      const position = style?.position || 'middle';
      const aspectRatio = style?.aspectRatio || '9:16';
      const customText = style?.text;

      // Dimensions based on ratio
      const width = aspectRatio === '9:16' ? 1080 : 1920;
      const height = aspectRatio === '9:16' ? 1920 : 1080;

      // Use custom text if provided, otherwise wrap the default quote text
      let finalDisplayText = customText || text;
      if (!customText) {
        const maxChars = Math.floor((width * 0.75) / (fontSize * 0.5)); 
        finalDisplayText = this.wrapText(text, maxChars);
      }

      // Escape text for FFmpeg drawtext filter
      const escapedText = finalDisplayText
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, '\\n');

      let yPos = '(h-text_h)/2';
      if (position === 'top') yPos = 'h/4';
      if (position === 'bottom') yPos = '3*h/4-text_h';

      console.log(colors.yellow(`[VideoService] Running FFmpeg for video ${videoId} (${aspectRatio})...`));
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(imagePath)
          .inputOptions(['-loop 1', '-framerate 30'])
          .input(audioPath)
          .complexFilter([
            // Use 'increase' + 'crop' to match 'background-size: cover'
            `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},drawtext=fontfile='${fontPath}':text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:borderw=2:bordercolor=${borderColor}:line_spacing=15:x=(w-text_w)/2:y=${yPos}`
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
      });

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
    } catch (error: any) {
      console.error(colors.red(`[VideoService] Error processing video ${videoId}:`), error);
      await this.videoRepository.update(videoId, {
        status: 'failed',
        error: error.message,
      });
    } finally {
      try {
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {}
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
