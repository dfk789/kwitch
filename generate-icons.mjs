/**
 * Generate PNG icons from SVG
 */
import sharp from 'sharp';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];
const svgPath = resolve(__dirname, 'assets/icons/icon.svg');

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = resolve(__dirname, `assets/icons/icon-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
