import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { buildSrc, buildTransformationString, upload, getResponsiveImageAttributes } from '@imagekit/javascript';

ffmpeg.setFfmpegPath(ffmpegPath);

const IMAGE = 'test.jpg';
const AUDIO = 'test.mp3';
const OUTPUT = 'output.mp4';

const fontPath = 'C\\:/Windows/Fonts/arial.ttf';

const text = `Hello World my self an AI
lets share life lessons
in this video`;

ffmpeg()
  .input(IMAGE)
  .inputOptions(['-loop 1'])
  .input(AUDIO)

  .complexFilter([
    `scale=1080:1920:force_original_aspect_ratio=decrease,
     pad=1080:1920:(ow-iw)/2:(oh-ih)/2,
     setsar=1,
     drawtext=fontfile='${fontPath}':
     text='${text}':
     fontsize=72:
     fontcolor=black:
     line_spacing=25:
     borderw=3:
     bordercolor=white:
     x=(w-text_w)/2:
     y=(h-text_h)/2`
  ])

  .outputOptions([
    // 🎬 Video
    '-c:v libx264',
    '-profile:v high',
    '-level 4.1',
    '-pix_fmt yuv420p',
    '-r 30',

    // 📊 Bitrate control (<= 5 Mbps)
    '-b:v 5000k',
    '-maxrate 5000k',
    '-bufsize 10000k',

    // 🎵 Audio
    '-c:a aac',
    '-b:a 128k',
    '-ar 48000',
    '-ac 2',

    // ⏱ Duration sync
    '-shortest',

    // ⚡ Fast start (CRITICAL for Instagram API)
    '-movflags +faststart',
  ])

  .save(OUTPUT)

  .on('start', cmd => console.log('FFmpeg:', cmd))
  .on('end', () => console.log('✅ Instagram-ready video created'))
  .on('error', err => console.error('❌ Error:', err));