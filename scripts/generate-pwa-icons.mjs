/**
 * Generates PWA icons from resources/icon.png or an inline SVG rose tile.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const sourceIcon = resolve(__dirname, '..', 'resources', 'icon.png');
const roseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb2e63"/>
      <stop offset="100%" stop-color="#eaaf36"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#g)"/>
  <path transform="translate(512 512) scale(28) translate(-12 -12)" fill="#fff" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
</svg>`;

async function sourceBuffer() {
  if (existsSync(sourceIcon)) {
    return sharp(sourceIcon);
  }
  return sharp(Buffer.from(roseSvg));
}

const img = await sourceBuffer();
for (const size of [192, 512]) {
  const buf = await img.clone().resize(size, size).png().toBuffer();
  const path = resolve(outDir, `icon-${size}.png`);
  writeFileSync(path, buf);
  console.log('wrote', path);
}
