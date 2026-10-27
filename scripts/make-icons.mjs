/**
 * Builds the favicon set from the school emblem.
 *
 * The emblem is a transparent PNG, which looks broken on a browser tab — most
 * tab bars are light, and a gold shell on nothing reads as a floating smudge.
 * So the icon versions are composited onto the brand plum, matching the nav.
 *
 * Usage:  node scripts/make-icons.mjs
 * Input:  public/yugam-logo.png   (transparent, square-ish, 256px or larger)
 * Output: public/favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC = path.resolve('public');
const SOURCE = path.join(PUBLIC, 'yugam-logo.png');
const PLUM = '#2E1065';

if (!fs.existsSync(SOURCE) || fs.statSync(SOURCE).size === 0) {
  console.error(`[icons] ${SOURCE} is missing or empty.`);
  console.error('[icons] Save the emblem there, then run this again.');
  process.exit(1);
}

const sips = (args) => execFileSync('sips', args, { stdio: ['ignore', 'pipe', 'pipe'] });

// Sizes browsers actually request, and what each is for.
const targets = [
  { file: 'favicon-32.png', size: 32, pad: 0.18 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.16 },
  { file: 'icon-192.png', size: 192, pad: 0.16 },
  { file: 'icon-512.png', size: 512, pad: 0.16 },
];

for (const { file, size, pad } of targets) {
  const out = path.join(PUBLIC, file);
  const inner = Math.round(size * (1 - pad * 2));

  // Scale the emblem to the inner box, then pad out to the full square on
  // plum — `sips --padToHeightWidth` fills with the colour given by --padColor.
  sips(['-s', 'format', 'png', '-Z', String(inner), SOURCE, '--out', out]);
  sips([
    '-p', String(size), String(size),
    '--padColor', PLUM.replace('#', ''),
    out, '--out', out,
  ]);
  console.log(`[icons] wrote ${file} (${size}px)`);
}

console.log('[icons] done — hard-refresh the browser to see the new tab icon.');
