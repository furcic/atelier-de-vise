import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const logo = path.join(root, 'public/logo.svg');
const cream = '#f8f2eb';

async function render(target, width, height, logoSize, transparent = false) {
  const mark = await sharp(logo).resize(logoSize, logoSize, { fit: 'inside' }).png().toBuffer();
  const raster = sharp({
    create: { width, height, channels: 4, background: transparent ? '#00000000' : cream },
  }).composite([{ input: mark, gravity: 'centre' }]);
  if (!transparent) raster.removeAlpha();
  await raster.png().toFile(path.join(root, target));
}

await render('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 1024, 760);
for (const name of ['', '-1', '-2']) {
  await render(
    `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${name}.png`,
    2732,
    2732,
    460,
  );
}
for (const [density, scale] of Object.entries({
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
})) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    await render(`${dir}/${name}.png`, 48 * scale, 48 * scale, Math.round(34 * scale));
  }
  // Keep the entire flower inside the adaptive icon's 66dp safe zone.
  await render(`${dir}/ic_launcher_foreground.png`, 108 * scale, 108 * scale, 60 * scale, true);
}
const res = 'android/app/src/main/res';
for (const dir of await readdir(path.join(root, res))) {
  if (!dir.startsWith('drawable')) continue;
  const target = `${res}/${dir}/splash.png`;
  try {
    const { width, height } = await sharp(path.join(root, target)).metadata();
    await render(target, width, height, Math.round(Math.min(width, height) * 0.24));
  } catch (error) {
    if (!String(error.message).includes('Input file is missing')) throw error;
  }
}
console.log('Android and iOS icons and launch screens generated from public/logo.svg.');
