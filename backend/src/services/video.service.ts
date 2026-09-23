import axios from 'axios';
import { exec } from 'child_process';
import colors from 'colors';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import ImageKit from 'imagekit';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { cleanBase64 } from '../utils/base64.util.js';
import { MovieRepository } from '../repositories/movie.repository.js';
import { QuoteRepository } from '../repositories/quote.repository.js';
import { SongRepository } from '../repositories/song.repository.js';
import { VideoRepository, type VideoMetadata } from '../repositories/video.repository.js';

const streamPipeline = promisify(pipeline);
const execPromise = promisify(exec);

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
    quoteId?: string | undefined,
    songId?: string | undefined,
    imageBase64?: string | undefined,
    imageUrl?: string | undefined,
    style?: {
      text?: string | undefined;
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
      aspectRatio?: '9:16' | '16:9' | undefined;
      audioStartTime?: number | undefined;
      audioEndTime?: number | undefined;
      fadeInDuration?: number | undefined;
      fadeOutDuration?: number | undefined;
      audioFadeIn?: number | undefined;
      audioFadeOut?: number | undefined;
      videoFadeIn?: number | undefined;
      videoFadeOut?: number | undefined;
    }
  ): Promise<VideoMetadata> {
    let text = style?.text || '';

    if (quoteId) {
      const quote = await this.quoteRepository.findById(quoteId);
      if (quote && !text) {
        text = quote.text;
      }
    }

    if (!songId) throw new Error('Song ID is required');
    const song = await this.songRepository.findById(songId);
    if (!song) throw new Error('Song not found');

    const audioUrl = song.url;

    let targetImageUrl = imageUrl;
    if (!targetImageUrl && !imageBase64) {
      targetImageUrl = 'https://ik.imagekit.io/jasswanth/test.jpg';
    }

    const videoData: Partial<VideoMetadata> = {
      status: 'pending',
      song_id: songId,
    };
    if (quoteId) {
      videoData.quote_id = quoteId;
    }

    const videoRecord = await this.videoRepository.create(videoData);
    const videoId = videoRecord.id!;

    this.processVideo(videoId, targetImageUrl, imageBase64, audioUrl, text, quoteId, style).catch(err => {
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

    return text.split('\n').map(segment => {
      const words = segment.trim().split(/\s+/);
      let lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        if (!word) return;
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines.join('\n');
    }).join('\n');
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      // ffmpeg -i returns info in stderr
      const { stderr } = await execPromise(`"${ffmpegPath}" -i "${audioPath}"`);
      const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (match) {
        const hours = parseInt(match[1]!);
        const minutes = parseInt(match[2]!);
        const seconds = parseInt(match[3]!);
        const hundredths = parseInt(match[4]!);
        return hours * 3600 + minutes * 60 + seconds + hundredths / 100;
      }
      return 30; // Default fallback
    } catch (err: any) {
      // ffmpeg -i returns exit code 1 for no output, so we check stderr anyway
      const match = err.stderr?.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (match) {
        const hours = parseInt(match[1]!);
        const minutes = parseInt(match[2]!);
        const seconds = parseInt(match[3]!);
        const hundredths = parseInt(match[4]!);
        return hours * 3600 + minutes * 60 + seconds + hundredths / 100;
      }
      return 30;
    }
  }

  private async processVideo(
    videoId: string,
    imageUrl: string | undefined,
    imageBase64: string | undefined,
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
      audioStartTime?: number | undefined;
      audioEndTime?: number | undefined;
      fadeInDuration?: number | undefined;
      fadeOutDuration?: number | undefined;
      audioFadeIn?: number | undefined;
      audioFadeOut?: number | undefined;
      videoFadeIn?: number | undefined;
      videoFadeOut?: number | undefined;
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
      
      if (imageBase64) {
        tasks.push((async () => {
          const cleaned = cleanBase64(imageBase64);
          const buffer = Buffer.from(cleaned, 'base64');
          fs.writeFileSync(imagePath, buffer);
        })());
      } else if (imageUrl) {
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

      // Get total audio duration
      const totalDuration = await this.getAudioDuration(audioPath);
      const audioStartTime = Math.max(0, style?.audioStartTime || 0);
      let audioEndTime = style?.audioEndTime;

      let duration = totalDuration - audioStartTime;
      if (audioEndTime && audioEndTime > audioStartTime) {
        duration = audioEndTime - audioStartTime;
      }
      if (duration <= 0) {
        duration = Math.min(30, totalDuration);
      }

      console.log(colors.cyan(`[VideoService] Total audio: ${totalDuration}s, Trimming segment: ${audioStartTime}s to ${audioStartTime + duration}s (Duration: ${duration}s)`));

      let fontPath = 'arial.ttf'; 
      if (process.platform === 'win32') {
        // FFmpeg on Windows: use forward slashes and escape the colon
        fontPath = 'C:/Windows/Fonts/arial.ttf'.replace(/:/g, '\\:');
      } else {
        // Common paths on Linux (Render/Ubuntu)
        const possibleFonts = [
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          '/usr/share/fonts/TTF/DejaVuSans.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
          'arial.ttf'
        ];
        for (const f of possibleFonts) {
          if (fs.existsSync(f)) {
            fontPath = f;
            break;
          }
        }
      }

      const fontSize = style?.fontSize || 64; 
      let fontColor = style?.fontColor || 'white';
      const rawFontColor = fontColor; // Keep for border fallback
      if (fontColor.startsWith('#')) {
        fontColor = fontColor.replace('#', '0x');
      }
      
      let borderColor = style?.borderColor || 'black';
      const borderWeight = (borderColor === 'transparent' || !borderColor) ? 0 : 1;
      
      // If transparent, use the same color as text as a safe fallback for FFmpeg
      if (borderColor === 'transparent') {
        borderColor = rawFontColor;
      }
      
      if (borderColor.startsWith('#')) {
        borderColor = borderColor.replace('#', '0x');
      }

      const position = style?.position || 'middle';
      const aspectRatio = style?.aspectRatio || '9:16';
      // Use 1080p Full HD base for highest quality video generation
      const width = aspectRatio === '9:16' ? 1080 : 1920;
      const height = aspectRatio === '9:16' ? 1920 : 1080;

      const customText = style?.text;
      // Use custom text if provided, otherwise default quote text
      let finalDisplayText = customText !== undefined ? customText : text;

      // Calculate video fade in/out durations (capped at duration / 2)
      const rawVideoFadeIn = style?.videoFadeIn ?? style?.fadeInDuration ?? 0;
      const rawVideoFadeOut = style?.videoFadeOut ?? style?.fadeOutDuration ?? 0;
      const videoFadeInDuration = Math.min(Math.max(0, rawVideoFadeIn), duration / 2);
      const videoFadeOutDuration = Math.min(Math.max(0, rawVideoFadeOut), duration / 2);

      // Calculate audio fade in/out durations (capped at duration / 2)
      const rawAudioFadeIn = style?.audioFadeIn ?? style?.fadeInDuration ?? 0;
      const rawAudioFadeOut = style?.audioFadeOut ?? style?.fadeOutDuration ?? 0;
      const audioFadeInDuration = Math.min(Math.max(0, rawAudioFadeIn), duration / 2);
      const audioFadeOutDuration = Math.min(Math.max(0, rawAudioFadeOut), duration / 2);

      let hasText = false;
      const vFilters: string[] = [
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`
      ];

      if (finalDisplayText && finalDisplayText.trim().length > 0) {
        hasText = true;
        const maxChars = Math.floor((width * 0.9) / (fontSize * 0.44)); 
        finalDisplayText = this.wrapText(finalDisplayText, maxChars);

        // Write text to a file to handle newlines and special characters correctly in FFmpeg
        const textFilePath = path.join(tmpDir, 'text.txt');
        fs.writeFileSync(textFilePath, finalDisplayText);
        // FFmpeg on Windows needs the path escaped for the filter
        const escapedTextFilePath = textFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');

        // Match frontend positions precisely
        let yPos = '(h-text_h)/2';
        if (position === 'top') yPos = 'h/4-text_h/2';
        if (position === 'bottom') yPos = '3*h/4-text_h/2';

        const lineSpacing = Math.round(fontSize * 0.2);
        vFilters.push(`drawtext=fontfile='${fontPath}':textfile='${escapedTextFilePath}':fontsize=${fontSize}:fontcolor='${fontColor}':borderw=${borderWeight}:bordercolor='${borderColor}':x=(w-text_w)/2:y=${yPos}:line_spacing=${lineSpacing}`);
      }

      if (videoFadeInDuration > 0) {
        vFilters.push(`fade=t=in:st=0:d=${videoFadeInDuration}`);
      }
      if (videoFadeOutDuration > 0) {
        const fadeOutStart = Math.max(0, duration - videoFadeOutDuration);
        vFilters.push(`fade=t=out:st=${fadeOutStart.toFixed(2)}:d=${videoFadeOutDuration}`);
      }

      const aFilters: string[] = [];
      if (audioFadeInDuration > 0) {
        aFilters.push(`afade=t=in:st=0:d=${audioFadeInDuration}`);
      }
      if (audioFadeOutDuration > 0) {
        const fadeOutStart = Math.max(0, duration - audioFadeOutDuration);
        aFilters.push(`afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${audioFadeOutDuration}`);
      }

      const vFilterChain = `[0:v]${vFilters.join(',')}[v]`;
      const aFilterChain = aFilters.length > 0 ? `[1:a]${aFilters.join(',')}[a]` : `[1:a]anull[a]`;
      const filterComplex = `${vFilterChain};${aFilterChain}`;

      console.log(colors.yellow(`[VideoService] Starting FFmpeg for video ${videoId} (${aspectRatio}, text: ${hasText ? 'yes' : 'none'})...`));

      const audioInputOptions: string[] = [];
      if (audioStartTime > 0) {
        audioInputOptions.push(`-ss ${audioStartTime}`);
      }

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(imagePath)
          .inputOptions(['-loop 1', '-framerate 30']);

        if (audioInputOptions.length > 0) {
          command.input(audioPath).inputOptions(audioInputOptions);
        } else {
          command.input(audioPath);
        }

        command
          .complexFilter(filterComplex)
          .outputOptions([
            '-map [v]',
            '-map [a]',
            '-c:v libx264',
            '-profile:v high',
            '-level 4.2',
            '-pix_fmt yuv420p',
            '-r 30',
            '-preset medium',
            '-crf 18',
            '-c:a aac',
            '-b:a 256k',
            '-ar 48000',
            '-ac 2',
            `-t ${duration + 0.1}`,
            '-movflags +faststart',
          ])
          .save(outputPath)
          .on('start', (commandLine) => {
            console.log(colors.blue('[VideoService] FFmpeg command: ') + commandLine);
          })
          .on('progress', (progress) => {
            if (progress.frames) {
              const totalFrames = Math.floor(duration * 30);
              const pct = Math.min(100, Math.round((progress.frames / totalFrames) * 100));
              console.log(colors.gray(`[VideoService] Processing: ${pct}% done`));
            }
          })
          .on('end', () => {
            console.log(colors.green(`[VideoService] FFmpeg completed for ${videoId}`));
            resolve();
          })
          .on('error', (err, stdout, stderr) => {
            console.error(colors.red('[VideoService] FFmpeg error:'), err.message);
            console.error(colors.red('[VideoService] FFmpeg stderr:'), stderr);
            reject(err);
          });
      });

      // Save locally to public/videos for local access
      const localVideosDir = path.join(process.cwd(), 'public', 'videos');
      if (!fs.existsSync(localVideosDir)) {
        fs.mkdirSync(localVideosDir, { recursive: true });
      }
      const localVideoPath = path.join(localVideosDir, `video_${videoId}.mp4`);
      fs.copyFileSync(outputPath, localVideoPath);
      console.log(colors.cyan(`[VideoService] Saved local copy at ${localVideoPath}`));

      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
      let videoUrl = `${baseUrl}/videos/video_${videoId}.mp4`;
      let fileId = `local_${Date.now()}`;

      if (process.env.USE_LOCAL_STORAGE !== 'true' && process.env.IMAGEKIT_PUBLIC_KEY) {
        try {
          const fileBuffer = fs.readFileSync(outputPath);
          const uploadResponse = await this.imagekit.upload({
            file: fileBuffer,
            fileName: `video_${videoId}.mp4`,
            folder: '/generated_videos/',
          });
          fileId = uploadResponse.fileId;
          const isDev = process.env.NODE_ENV !== 'production' || !process.env.RENDER;
          if (!isDev) {
            videoUrl = uploadResponse.url;
          }
        } catch (ikErr: any) {
          console.warn(colors.yellow(`[VideoService] ImageKit upload failed, using local video URL: ${ikErr.message}`));
        }
      }

      await this.videoRepository.update(videoId, {
        status: 'completed',
        url: videoUrl,
        imagekit_file_id: fileId,
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
