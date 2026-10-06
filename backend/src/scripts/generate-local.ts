import { VideoService } from '../services/video.service.js';
import path from 'path';
import fs from 'fs';
import colors from 'colors';

async function main() {
  console.log(colors.cyan.bold('\n🎬 === LOCAL VIDEO GENERATION ==='));
  
  const videoService = new VideoService();
  const videoId = `local_${Date.now()}`;

  const imagePath = path.resolve(process.cwd(), 'test.jpg');
  const audioPath = path.resolve(process.cwd(), 'test.mp3');

  if (!fs.existsSync(imagePath)) {
    console.error(colors.red(`❌ Image file not found at: ${imagePath}`));
    process.exit(1);
  }
  if (!fs.existsSync(audioPath)) {
    console.error(colors.red(`❌ Audio file not found at: ${audioPath}`));
    process.exit(1);
  }

  // Parse optional CLI options (e.g. npm run video:local -- "My text" --font=impact --style=bold --hpos=left)
  const args = process.argv.slice(2);
  let quoteText = 'Local Video Generation\nRendered entirely on local machine\nFast & High Quality';
  let fontFamily = 'sans';
  let fontStyle = 'normal';
  let hPosition: 'left' | 'center' | 'right' = 'center';
  let vPosition: 'top' | 'middle' | 'bottom' = 'middle';

  for (const arg of args) {
    if (arg.startsWith('--font=')) {
      fontFamily = arg.split('=')[1] || 'sans';
    } else if (arg.startsWith('--style=')) {
      fontStyle = arg.split('=')[1] || 'normal';
    } else if (arg.startsWith('--hpos=')) {
      hPosition = (arg.split('=')[1] as any) || 'center';
    } else if (arg.startsWith('--vpos=')) {
      vPosition = (arg.split('=')[1] as any) || 'middle';
    } else if (!arg.startsWith('--')) {
      quoteText = arg;
    }
  }

  console.log(colors.yellow(`Input Image : `) + imagePath);
  console.log(colors.yellow(`Input Audio : `) + audioPath);
  console.log(colors.yellow(`Overlay Text: `) + quoteText.replace(/\n/g, ' / '));
  console.log(colors.yellow(`Font Family : `) + `${fontFamily} (${fontStyle})`);
  console.log(colors.yellow(`Position    : `) + `H:${hPosition}, V:${vPosition}`);
  console.log(colors.blue(`Starting FFmpeg rendering...\n`));

  const startTime = Date.now();

  try {
    await videoService.processVideo(
      videoId,
      imagePath,
      undefined,
      audioPath,
      quoteText,
      undefined,
      {
        fontSize: 52,
        fontColor: 'white',
        borderColor: 'black',
        position: vPosition,
        hPosition: hPosition,
        fontFamily: fontFamily,
        fontStyle: fontStyle,
        aspectRatio: '9:16',
        audioStartTime: 0,
        audioEndTime: 10,
        videoFadeIn: 1,
        videoFadeOut: 1,
        audioFadeIn: 1,
        audioFadeOut: 1,
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const outputPath = path.join(process.cwd(), 'public', 'videos', `video_${videoId}.mp4`);
    
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(colors.green.bold(`\n✅ VIDEO GENERATED SUCCESSFULLY in ${elapsed}s!`));
      console.log(colors.green(`📁 File Path: ${outputPath}`));
      console.log(colors.green(`📊 File Size: ${sizeMb} MB`));
      console.log(colors.cyan(`🌐 When server is running, view at: http://localhost:3000/videos/video_${videoId}.mp4\n`));
    } else {
      console.log(colors.green.bold(`\n✅ Video processing completed in ${elapsed}s.\n`));
    }
  } catch (error: any) {
    console.error(colors.red.bold(`\n❌ Video generation failed:`), error.message);
    process.exit(1);
  }
}

main();
