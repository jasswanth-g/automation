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
    quoteId: string,
    songId: string,
    style?: {
      text?: string | undefined;
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
      textAlign?: 'left' | 'center' | 'right' | undefined;
      aspectRatio?: '9:16' | '16:9' | undefined;
      audioStartTime?: number | undefined;
      audioEndTime?: number | undefined;
      lineHeight?: number | undefined;
      textPadding?: number | undefined;
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
    audioUrl: string,
    text: string,
    quoteId?: string,
    style?: {
      text?: string | undefined;
      fontSize?: number | undefined;
      fontColor?: string | undefined;
      borderColor?: string | undefined;
      position?: 'top' | 'middle' | 'bottom' | undefined;
      textAlign?: 'left' | 'center' | 'right' | undefined;
      aspectRatio?: '9:16' | '16:9' | undefined;
      audioStartTime?: number | undefined;
      audioEndTime?: number | undefined;
      lineHeight?: number | undefined;
      textPadding?: number | undefined;
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

      // Get audio duration to prevent infinite loops
      const duration = await this.getAudioDuration(audioPath);
      console.log(colors.cyan(`[VideoService] Detected audio duration: ${duration}s`));

      let fontPath = 'arialbi.ttf'; 
      if (process.platform === 'win32') {
        // FFmpeg on Windows: use forward slashes and escape the colon
        fontPath = 'C:/Windows/Fonts/arialbi.ttf'.replace(/:/g, '\\:');
      } else {
        // Common paths on Linux (Render/Ubuntu)
        const possibleFonts = [
          '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldItalic.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSansBoldItalic.ttf',
          'arialbi.ttf'
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
      const borderWeight = (borderColor === 'transparent' || !borderColor) ? 0 : 2;
      
      // If transparent, use the same color as text as a safe fallback for FFmpeg
      if (borderColor === 'transparent') {
        borderColor = rawFontColor;
      }
      
      if (borderColor.startsWith('#')) {
        borderColor = borderColor.replace('#', '0x');
      }

      const position = style?.position || 'middle';
      const textAlign = style?.textAlign || 'center';
      const aspectRatio = style?.aspectRatio || '9:16';
      const customText = style?.text;
      const audioStartTime = style?.audioStartTime || 0;
      const audioEndTime = style?.audioEndTime;
      const lineHeight = style?.lineHeight || 1.3;
      const textPadding = style?.textPadding || 20;

      // Use 720p base for significantly faster processing
      const width = aspectRatio === '9:16' ? 720 : 1280;
      const height = aspectRatio === '9:16' ? 1280 : 720;

      // Scale padding from preview to video
      // 9:16 -> 720 / 300 = 2.4
      // 16:9 -> 1280 / 480 = 2.666...
      const widthScale = aspectRatio === '9:16' ? 2.4 : 2.6666666667;
      const scaledPadding = Math.round(textPadding * widthScale);

      // Get audio duration to prevent infinite loops
      const totalAudioDuration = await this.getAudioDuration(audioPath);
      console.log(colors.cyan(`[VideoService] Detected total audio duration: ${totalAudioDuration}s`));

      // Calculate final duration
      const requestedDuration = audioEndTime ? (audioEndTime - audioStartTime) : 30;
      const finalDuration = Math.min(requestedDuration, totalAudioDuration - audioStartTime);
      console.log(colors.cyan(`[VideoService] Final video duration: ${finalDuration}s (Start: ${audioStartTime}s)`));

      // Use custom text if provided, otherwise wrap the default quote text
      let finalDisplayText = customText || text;
      
      // Always apply wrapping to ensure it fits the video width, even for custom text
      // 0.5 factor is more accurate for Arial Bold Italic to prevent right-side crowding
      const maxChars = Math.floor((width - (scaledPadding * 2)) / (fontSize * 0.5)); 
      finalDisplayText = this.wrapText(finalDisplayText, maxChars);

      // Write text to a file to handle newlines and special characters correctly in FFmpeg
      const textFilePath = path.join(tmpDir, 'text.txt');
      fs.writeFileSync(textFilePath, finalDisplayText);
      // FFmpeg on Windows needs the path escaped for the filter
      const escapedTextFilePath = textFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');

      // Match frontend positions precisely
      let yPos = '(h-text_h)/2';
      if (position === 'top') yPos = scaledPadding.toString();
      if (position === 'bottom') yPos = `h-text_h-${scaledPadding}`;

      // Match frontend horizontal alignment
      let xPos = scaledPadding.toString();
      if (textAlign === 'center') xPos = '(w-text_w)/2';
      if (textAlign === 'right') xPos = `w-text_w-${scaledPadding}`;

      console.log(colors.yellow(`[VideoService] Starting FFmpeg for video ${videoId} (${aspectRatio})...`));

      const lineSpacing = Math.round(fontSize * (lineHeight - 1));
      // Use full text_align if available (center, left, right)
      const textAlignParam = textAlign;
      const filterComplex = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},drawtext=fontfile='${fontPath}':textfile='${escapedTextFilePath}':fontsize=${fontSize}:fontcolor='${fontColor}':borderw=${borderWeight}:bordercolor='${borderColor}':x=${xPos}:y=${yPos}:line_spacing=${lineSpacing}:text_align=${textAlignParam}:fix_bounds=1[v];[1:a]anull[a]`;

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(imagePath)
          .inputOptions(['-loop 1', '-framerate 30'])
          .input(audioPath)
          .inputOptions([`-ss ${audioStartTime}`])
          .complexFilter(filterComplex)
          .outputOptions([
            '-map [v]',
            '-map [a]',
            '-c:v libx264',
            '-profile:v high',
            '-level 4.1',
            '-pix_fmt yuv420p',
            '-r 30',
            '-preset ultrafast', // Maximum speed
            '-crf 28',           // Slightly higher CRF for speed
            '-c:a aac',
            '-b:a 128k',
            '-ar 48000',
            '-ac 2',
            `-t ${finalDuration + 0.1}`, // Explicit limit
            '-movflags +faststart',
          ])
          .save(outputPath)
          .on('start', (commandLine) => {
            console.log(colors.blue('[VideoService] FFmpeg command: ') + commandLine);
          })
          .on('progress', (progress) => {
            if (progress.frames) {
              const totalFrames = Math.floor(finalDuration * 30);
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

      // Save locally to public/videos for local access only in development
      const isDev = process.env.NODE_ENV !== 'production' || !process.env.RENDER;
      
      if (isDev) {
        const localVideosDir = path.join(process.cwd(), 'public', 'videos');
        if (!fs.existsSync(localVideosDir)) {
          fs.mkdirSync(localVideosDir, { recursive: true });
        }
        const localVideoPath = path.join(localVideosDir, `video_${videoId}.mp4`);
        fs.copyFileSync(outputPath, localVideoPath);
        console.log(colors.cyan(`[VideoService] Saved local copy at ${localVideoPath}`));
      }

      const fileBuffer = fs.readFileSync(outputPath);
      const uploadResponse = await this.imagekit.upload({
        file: fileBuffer,
        fileName: `video_${videoId}.mp4`,
        folder: '/generated_videos/',
      });

      const videoUrl = uploadResponse.url;

      await this.videoRepository.update(videoId, {
        status: 'completed',
        url: videoUrl,
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
