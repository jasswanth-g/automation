import { FFCreatorCenter, FFScene, FFImage, FFText, FFCreator } from 'ffcreatorlite';
import colors from 'colors';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';

FFCreator.setFFmpegPath(ffmpegPath);

const cacheDir = path.resolve('./cache');
const outputDir = path.resolve('./output');
const bg1 = './test.jpg';
const audio = './test.mp3';
const img1 = './test.jpg';
const logo = './test.jpg';


// create creator instance
const creator = new FFCreator({
  cacheDir,
  outputDir,
  width: 600,
  height: 400,
  log: true,
});

// create FFScene
const scene1 = new FFScene();
const scene2 = new FFScene();
// scene1.setBgColor('#ff0000');
// scene2.setBgColor('#b33771');

// scene1
const fbg = new FFImage({ path: bg1 });
fbg.addEffect('fadeIn', 1, 1);
scene1.addChild(fbg);
scene1.addAudio(audio);

// const fimg1 = new FFImage({ path: img1, x: 300, y: 60 });
// fimg1.addEffect('moveInRight', 1.5, 1.2);
// scene1.addChild(fimg1);

const text = new FFText({ text: 'Hello World my self an AI lets share life lessons in this video', x: 100, y: 100 });
text.setColor('#000000');
// text.setBackgroundColor('#000000');
// text.addEffect('fadeIn', 1, 1);
scene1.addChild(text);

scene1.setDuration(8);
creator.addChild(scene1);

// scene2
// const fbg2 = new FFImage({ path: bg1 });
// scene2.addChild(fbg2);
// // logo
// const flogo = new FFImage({ path: logo, x: 100, y: 100 });
// flogo.addEffect('moveInUpBack', 1.2, 0.3);
// scene2.addChild(flogo);

// scene2.setDuration(4);
// creator.addChild(scene2);

// creator.addAudio(audio);
creator.addAudio(audio);
creator.start();

creator.on('error', e => {
  console.error(colors.red(`FFCreatorLite error: ${e.error || e}`));
});

creator.on('progress', e => {
  console.log(colors.yellow(`FFCreatorLite progress: ${(e.percent * 100) >> 0}%`));
});

creator.on('complete', e => {
  console.log(
    colors.magenta(`FFCreatorLite completed: \n USEAGE: ${e.useage} \n PATH: ${e.output} `),
  );
});