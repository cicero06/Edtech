/**
 * Rebuilds a walk sheet by SEGMENTING each character instead of trusting the
 * source grid. The generated sheets let characters overflow their cells, so
 * naive slicing leaves neighbour fragments ("taşma") inside frames.
 *
 * For every grid cell we flood-fill the connected opaque region starting at
 * the character's own pixel (nearest opaque pixel to the cell centre). Stray
 * fragments from neighbours are disconnected, so they never join the mask.
 * Each full character is then bottom-aligned into a uniform padded frame.
 *
 *   node tools/repack-walk.mjs
 */

import { readPng, writePng } from './png.mjs';

const COLS = 3;
const ROWS = 4;
const PAD = 24; // transparent border baked into every frame
const ALPHA = 24; // flood-fill threshold

const JOBS = [
  { src: '/tmp/playerboy_walk-orig.png', out: 'public/assets/characters/playerboy_walk.png' },
  { src: '/tmp/lina_walk-orig.png', out: 'public/assets/characters/lina_walk.png' },
];

/** BFS over alpha >= ALPHA starting at the opaque pixel nearest (cx, cy). */
function characterMask(img, x0, y0, w, h) {
  const { width, height, data } = img;
  // Seed: nearest opaque pixel to the cell centre.
  let seed = null;
  let best = Infinity;
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (data[(y * width + x) * 4 + 3] < 200) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < best) {
        best = d;
        seed = [x, y];
      }
    }
  }
  if (!seed) throw new Error('no opaque seed in cell');

  const mask = new Uint8Array(width * height);
  const stack = [seed];
  mask[seed[1] * width + seed[0]] = 1;
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const i = ny * width + nx;
      if (mask[i] || data[i * 4 + 3] < ALPHA) continue;
      mask[i] = 1;
      stack.push([nx, ny]);
    }
  }
  return mask;
}

for (const { src, out } of JOBS) {
  const img = readPng(src);
  const cw = Math.floor(img.width / COLS);
  const ch = Math.floor(img.height / ROWS);
  const sprites = [];
  let maxW = 0;
  let maxH = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const mask = characterMask(img, col * cw, row * ch, cw, ch);
      let minX = img.width;
      let minY = img.height;
      let maxX = 0;
      let maxY = 0;
      const keep = new Uint8Array(img.width * img.height);
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = y * img.width + x;
          if (!mask[i]) continue;
          keep[i] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const pixels = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const si = (minY + y) * img.width + minX + x;
          if (!keep[si]) continue;
          pixels.set(img.data.subarray(si * 4, si * 4 + 4), (y * bw + x) * 4);
        }
      }
      sprites.push({ pixels, w: bw, h: bh });
      if (bw > maxW) maxW = bw;
      if (bh > maxH) maxH = bh;
    }
  }

  const fw = maxW + PAD * 2;
  const fh = maxH + PAD * 2;
  const sheet = Buffer.alloc(fw * COLS * fh * ROWS * 4);
  sprites.forEach((s, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const dx = col * fw + Math.floor((fw - s.w) / 2); // centred horizontally
    const dy = row * fh + (fh - PAD - s.h); // feet on the same baseline
    for (let y = 0; y < s.h; y++) {
      s.pixels.copy(sheet, ((dy + y) * fw * COLS + dx) * 4, y * s.w * 4, (y + 1) * s.w * 4);
    }
  });

  writePng(out, fw * COLS, fh * ROWS, sheet);
  console.log(`${out}: frame ${fw}x${fh}, sheet ${fw * COLS}x${fh * ROWS}`);
}
