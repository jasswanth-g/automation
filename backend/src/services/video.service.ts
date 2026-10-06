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
      hPosition?: 'left' | 'center' | 'right' | undefined;
      fontFamily?: string | undefined;
      fontStyle?: string | undefined;
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

  private wrapText(text: string, maxChars: number): string[] {
    const normalized = text.replace(/\\n/g, '\n');
    const rawSegments = normalized.split(/\r?\n/);
    const resultLines: string[] = [];

    for (const segment of rawSegments) {
      if (!segment.trim()) {
        resultLines.push('');
        continue;
      }

      const words = segment.trim().split(/\s+/);
      let currentLine = '';

      for (const word of words) {
        if (!currentLine) {
          currentLine = word;
        } else if ((currentLine + ' ' + word).length <= maxChars) {
          currentLine += ' ' + word;
        } else {
          resultLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        resultLines.push(currentLine);
      }
    }

    return resultLines;
  }

  private resolveFontPath(family?: string, style?: string): string {
    const fam = (family || 'sans').toLowerCase();
    const st = (style || 'normal').toLowerCase();
    const isBold = st.includes('bold') || fam === 'impact';
    const isItalic = st.includes('italic');

    if (process.platform === 'win32') {
      let winFont = 'arial.ttf';
      if (fam.includes('serif') || fam.includes('georgia') || fam.includes('times')) {
        winFont = isBold ? (isItalic ? 'georgiaz.ttf' : 'georgiab.ttf') : (isItalic ? 'georgiai.ttf' : 'georgia.ttf');
      } else if (fam.includes('impact') || fam.includes('display')) {
        winFont = 'impact.ttf';
      } else if (fam.includes('mono') || fam.includes('courier')) {
        winFont = isBold ? 'courbd.ttf' : 'cour.ttf';
      } else if (fam.includes('hand') || fam.includes('comic')) {
        winFont = isBold ? 'comicbd.ttf' : 'comic.ttf';
      } else {
        winFont = isBold ? (isItalic ? 'arialbi.ttf' : 'arialbd.ttf') : (isItalic ? 'ariali.ttf' : 'arial.ttf');
      }
      return `C:/Windows/Fonts/${winFont}`.replace(/:/g, '\\:');
    }

    if (process.platform === 'darwin') {
      let macCandidates: string[] = [];
      if (fam.includes('serif') || fam.includes('georgia') || fam.includes('times')) {
        macCandidates = isBold
          ? (isItalic ? ['/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf', '/System/Library/Fonts/Supplemental/Times New Roman Bold Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Georgia Bold.ttf', '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf'])
          : (isItalic ? ['/System/Library/Fonts/Supplemental/Georgia Italic.ttf', '/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Times New Roman.ttf']);
      } else if (fam.includes('impact') || fam.includes('display')) {
        macCandidates = [
          '/System/Library/Fonts/Supplemental/Impact.ttf',
          '/System/Library/Fonts/Supplemental/Arial Black.ttf'
        ];
      } else if (fam.includes('mono') || fam.includes('courier')) {
        macCandidates = isBold
          ? (isItalic ? ['/System/Library/Fonts/Supplemental/Courier New Bold Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Courier New Bold.ttf'])
          : (isItalic ? ['/System/Library/Fonts/Supplemental/Courier New Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Courier New.ttf']);
      } else if (fam.includes('hand') || fam.includes('comic')) {
        macCandidates = isBold
          ? ['/System/Library/Fonts/Supplemental/Comic Sans MS Bold.ttf']
          : ['/System/Library/Fonts/Supplemental/Comic Sans MS.ttf'];
      } else {
        macCandidates = isBold
          ? (isItalic ? ['/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Arial Bold.ttf'])
          : (isItalic ? ['/System/Library/Fonts/Supplemental/Arial Italic.ttf']
                      : ['/System/Library/Fonts/Supplemental/Arial.ttf']);
      }

      for (const p of macCandidates) {
        if (fs.existsSync(p)) return p;
      }
      if (fs.existsSync('/System/Library/Fonts/Supplemental/Arial.ttf')) {
        return '/System/Library/Fonts/Supplemental/Arial.ttf';
      }
      return 'arial.ttf';
    }

    // Linux
    const linuxFonts = [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
      'arial.ttf'
    ];
    for (const f of linuxFonts) {
      if (fs.existsSync(f)) return f;
    }
    return 'arial.ttf';
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

  public async processVideo(
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
      hPosition?: 'left' | 'center' | 'right' | undefined;
      fontFamily?: string | undefined;
      fontStyle?: string | undefined;
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
      
      const tasks: Promise<void>[] = [];

      // Check if audio is locally hosted or on disk
      if (audioUrl.includes('localhost') && audioUrl.includes('/uploads/')) {
        const localRel = audioUrl.substring(audioUrl.indexOf('/uploads/'));
        const localPath = path.join(process.cwd(), 'public', localRel);
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, audioPath);
        } else {
          tasks.push(this.downloadFile(audioUrl, audioPath));
        }
      } else if (fs.existsSync(audioUrl)) {
        fs.copyFileSync(audioUrl, audioPath);
      } else {
        tasks.push(this.downloadFile(audioUrl, audioPath));
      }
      
      if (imageBase64) {
        tasks.push((async () => {
          const cleaned = cleanBase64(imageBase64);
          const buffer = Buffer.from(cleaned, 'base64');
          fs.writeFileSync(imagePath, buffer);
        })());
      } else if (imageUrl) {
        if (imageUrl.includes('localhost') && imageUrl.includes('/uploads/')) {
          const localRel = imageUrl.substring(imageUrl.indexOf('/uploads/'));
          const localPath = path.join(process.cwd(), 'public', localRel);
          if (fs.existsSync(localPath)) {
            fs.copyFileSync(localPath, imagePath);
          } else {
            tasks.push(this.downloadFile(imageUrl, imagePath));
          }
        } else if (fs.existsSync(imageUrl)) {
          fs.copyFileSync(imageUrl, imagePath);
        } else {
          tasks.push(this.downloadFile(imageUrl, imagePath));
        }
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

      const fontPath = this.resolveFontPath(style?.fontFamily, style?.fontStyle);

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
        const maxChars = Math.floor((width * 0.84) / (fontSize * 0.52)); 
        const lines = this.wrapText(finalDisplayText, maxChars);

        const lineHeight = Math.round(fontSize * 1.35);
        const totalH = lines.length * lineHeight;

        // Match frontend vertical positions precisely
        let startY = `(h-${totalH})/2`;
        if (position === 'top') startY = `h*0.25-${totalH}/2`;
        if (position === 'bottom') startY = `h*0.75-${totalH}/2`;

        // Match frontend horizontal positions precisely
        const hPosition = style?.hPosition || 'center';

        lines.forEach((line, i) => {
          if (!line.trim()) return; // Blank lines preserve vertical height via i * lineHeight

          const lineFilePath = path.join(tmpDir, `line_${i}.txt`);
          fs.writeFileSync(lineFilePath, line);
          const escapedLineFilePath = lineFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');

          const yPos = `${startY}+${i * lineHeight}`;

          let xPos = '(w-text_w)/2';
          if (hPosition === 'left') xPos = 'w*0.08';
          if (hPosition === 'right') xPos = 'w-text_w-w*0.08';

          vFilters.push(
            `drawtext=fontfile='${fontPath}':textfile='${escapedLineFilePath}':fontsize=${fontSize}:fontcolor='${fontColor}':borderw=${borderWeight}:bordercolor='${borderColor}':x=${xPos}:y=${yPos}`
          );
        });
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
