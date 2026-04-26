#!/usr/bin/env node
/**
 * One-shot script to generate prayer-jar-mark.png to both email asset locations
 *
 * Emails cannot reliably consume SVG with CSS custom properties (`--primary`),
 * so we bake a static amber fill into a 72x72 raster. The PNG is committed;
 * re-run this script only if the mark SVG changes.
 *
 *   node scripts/generate-jar-mark-png.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Baked amber for emails: matches dark-mode --primary (oklch 0.70 0.14 62)
// converted to sRGB — a warm candle-glow gold.
const AMBER = '#c08a3b';
// Foreground for the email's light background header (dark vessel).
const FG = '#1a1a1a';

const svg = `<svg width="72" height="72" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 6 C6 10, 4 13, 4 16 C4 19.5, 7 21, 12 21 C17 21, 20 19.5, 20 16 C20 13, 18 10, 18 6 Z" fill="${FG}" fill-opacity="0.7"/>
  <rect x="4" y="3" width="16" height="3" rx="1.5" fill="${FG}"/>
  <circle cx="12" cy="15" r="1.5" fill="${AMBER}"/>
</svg>`;

async function main() {
  const wasmPath = path.resolve(
    __dirname,
    '..',
    'node_modules',
    '@resvg',
    'resvg-wasm',
    'index_bg.wasm',
  );
  const wasm = await readFile(wasmPath);
  await initWasm(wasm);

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 72 } });
  const png = resvg.render().asPng();
  const outPath1 = path.resolve(
    __dirname,
    '..',
    'src',
    'emails',
    'assets',
    'prayer-jar-mark.png',
  );
  const outPath2 = path.resolve(
    __dirname,
    '..',
    'public',
    'email-assets',
    'prayer-jar-mark.png',
  );
  await Promise.all([
    writeFile(outPath1, png),
    writeFile(outPath2, png),
  ]);
  console.log(`Wrote ${outPath1} (${png.length} bytes)`);
  console.log(`Wrote ${outPath2} (${png.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
