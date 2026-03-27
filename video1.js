import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

// 🔹 Input
const IMAGE = './test.jpg';
const AUDIO = 'test.mp3';
const OUTPUT = 'output.mp4';

// 🔹 Text (auto wrapped manually)
const text = `Hello World my self an AI
lets share life lessons
in this video`;

// 🔹 Font path (IMPORTANT for Windows)
const fontPath = 'C\\:/Windows/Fonts/arial.ttf';

ffmpeg()
  .input(IMAGE)
  .inputOptions(['-loop 1'])
  .input(AUDIO)

  .complexFilter([
  `scale=1080:1920:force_original_aspect_ratio=decrease,
   pad=1080:1920:(ow-iw)/2:(oh-ih)/2,
   drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':
   text='Hello World my self an AI\nlets share life lessons\nin this account':
   fontsize=64:
   fontcolor=black:
   line_spacing=10:
   x=(w-text_w)/2:
   y=(h-text_h)/2:
   alpha='if(lt(t,1),t/1,1)'`
])

  // 4️⃣ Sync duration with audio
  .outputOptions([
    '-c:v libx264',
    '-preset slow',
    '-crf 16',
    '-pix_fmt yuv420p',
    '-c:a aac',
    '-shortest',
  ])

  .save(OUTPUT)

  .on('end', () => console.log('✅ Video created'))
  .on('error', err => console.error('❌ Error:', err));