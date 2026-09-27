/**
 * Slices the smooth illustrated asset sheet (`allassets.png`) into the
 * individual PNGs the game uses, and composes the 4-direction character
 * strips (down / right / up / left) used as spritesheets.
 *
 * Sources (kept under public/assets/reference/ so the tool is reproducible):
 *   - allassets.png            : 1536x1024 sheet, ~60 transparent islands
 *   - town-hall-source.png     : hi-res municipality building (was "town hall.png")
 *   - mansion-source.png       : hi-res flagless mansion (was "house-01.png")
 *
 *   node tools/slice-allassets.mjs
 *
 * Island indices are stable because detection sorts row-major; the labels were
 * verified visually (see docs in src/Game/data/assets.ts).
 */
import { readPng, writePng, crop } from './png.mjs';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = join(ROOT, 'public/assets/reference');
const OUT = join(ROOT, 'public/assets');
const DOWNLOADS = '/Users/macbook/Downloads';

const ALPHA_THRESHOLD = 16;
const MIN_PIXELS = 400;

// ---------------------------------------------------------------------------
// 0. Sources - copy into the repo once so the slice is reproducible
// ---------------------------------------------------------------------------

const SOURCES = {
  sheet: 'allassets.png',
  townHall: 'town hall.png',
  mansion: 'house-01.png',
};

function ensureSource(downloadsName, refName) {
  const refPath = join(REF, refName);
  if (!existsSync(refPath)) {
    copyFileSync(join(DOWNLOADS, downloadsName), refPath);
    console.log(`copied source -> ${refPath}`);
  }
  return refPath;
}

const sheetPath = ensureSource(SOURCES.sheet, 'allassets.png');
const townHallPath = ensureSource(SOURCES.townHall, 'town-hall-source.png');
const mansionPath = ensureSource(SOURCES.mansion, 'mansion-source.png');

// ---------------------------------------------------------------------------
// 1. Connected-component island detection (8-connectivity, alpha channel)
// ---------------------------------------------------------------------------

function findIslands(img, minPixels = MIN_PIXELS) {
  const { width: W, height: H, data } = img;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;

  const label = new Int32Array(W * H).fill(-1);
  const stack = new Int32Array(W * H);
  const islands = [];

  for (let start = 0; start < W * H; start++) {
    if (!solid[start] || label[start] !== -1) continue;
    const id = islands.length;
    let sp = 0;
    stack[sp++] = start;
    label[start] = id;
    let minX = W, minY = H, maxX = -1, maxY = -1, count = 0;

    while (sp > 0) {
      const p = stack[--sp];
      const x = p % W, y = (p - x) / W;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const np = ny * W + nx;
          if (!solid[np] || label[np] !== -1) continue;
          label[np] = id;
          stack[sp++] = np;
        }
      }
    }
    islands.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, count });
  }

  return islands
    .filter((i) => i.count >= minPixels)
    .sort((a, b) => Math.round(a.y / 60) - Math.round(b.y / 60) || a.x - b.x);
}

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

function write(destRel, width, height, data) {
  const dest = join(OUT, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  writePng(dest, width, height, data);
  const kb = (data.length / 1024).toFixed(0);
  console.log(`  ${destRel.padEnd(42)} ${width}x${height} (${kb} KB px)`);
}

/** Tight bounding box of the non-transparent pixels. */
function tightBounds(img) {
  const { width: W, height: H, data } = img;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= ALPHA_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function exportIsland(img, isl, destRel) {
  write(destRel, isl.w, isl.h, crop(img, isl.x, isl.y, isl.w, isl.h));
}

function exportTrimmed(img, destRel) {
  const b = tightBounds(img);
  if (!b) throw new Error(`${destRel}: no visible pixels`);
  write(destRel, b.w, b.h, crop(img, b.x, b.y, b.w, b.h));
}

/** Paste one island frame into a cell, bottom-centre anchored. */
function blit(sheet, isl, out, cellW, cellH, col, flipX = false) {
  const ox = col * cellW + Math.floor((cellW - isl.w) / 2);
  const oy = cellH - isl.h;
  for (let y = 0; y < isl.h; y++) {
    for (let x = 0; x < isl.w; x++) {
      const s = ((isl.y + y) * sheet.width + isl.x + x) * 4;
      const d = ((oy + y) * (cellW * 4) + ox + (flipX ? isl.w - 1 - x : x)) * 4;
      out[d] = sheet.data[s];
      out[d + 1] = sheet.data[s + 1];
      out[d + 2] = sheet.data[s + 2];
      out[d + 3] = sheet.data[s + 3];
    }
  }
}

/**
 * Composes a 4-frame horizontal strip [down, right, up, left] in uniform
 * cells. `frames` entries are island indices, or { isl, flip } for a mirrored
 * pose (used when the sheet only ships one side view).
 */
function composeCharacterSheet(sheet, frames, destRel, islands = findIslands(sheet)) {
  const parts = frames.map((f) => (typeof f === 'number' ? { isl: f, flip: false } : f));
  const cellW = Math.max(...parts.map((p) => islands[p.isl].w));
  const cellH = Math.max(...parts.map((p) => islands[p.isl].h));
  const out = Buffer.alloc(cellW * parts.length * cellH * 4);
  parts.forEach((p, col) => blit(sheet, islands[p.isl], out, cellW, cellH, col, p.flip));
  write(destRel, cellW * parts.length, cellH, out);
  return { frameWidth: cellW, frameHeight: cellH };
}

// ---------------------------------------------------------------------------
// 3. Slice
// ---------------------------------------------------------------------------

const sheet = readPng(sheetPath);
const islands = findIslands(sheet);
if (islands.length !== 60) {
  console.warn(`expected 60 islands, found ${islands.length} - verify the map below!`);
}

/** island index -> output path (verified visually against the numbered montage) */
const ISLAND_MAP = {
  // buildings / structures
  0: 'buildings/belediye.png',
  1: 'buildings/house-red.png',
  2: 'buildings/farmhouse.png',
  3: 'buildings/apartment.png',
  4: 'buildings/shop.png',
  5: 'water/dam-structure.png',
  6: 'water/treatment-plant.png',
  // agriculture
  7: 'agriculture/field-veg.png',
  8: 'agriculture/field-wheat.png',
  9: 'agriculture/greenhouse.png',
  10: 'agriculture/windmill.png',
  // nature
  11: 'nature/tree-round.png',
  12: 'nature/tree-round-2.png',
  13: 'nature/tree-blossom.png',
  14: 'nature/tree-pine.png',
  15: 'nature/tree-cypress.png',
  16: 'nature/flower-bush.png',
  17: 'nature/rocks.png',
  23: 'nature/bush.png',
  25: 'nature/bush-small.png',
  28: 'nature/hedge-row.png',
  59: 'nature/grass-patch.png',
  // props
  18: 'props/street-lamp.png',
  19: 'props/sign.png',
  20: 'props/fountain.png',
  21: 'props/planter.png',
  22: 'props/trash-can.png',
  24: 'props/bench.png',
  26: 'props/car-blue.png',
  27: 'props/tractor.png',
  29: 'ground/road-straight.png',
  42: 'props/car-white.png',
  43: 'props/crate.png',
  52: 'agriculture/haystack-big.png',
  53: 'ground/road-dash.png',
  54: 'water/water-deep.png',
  55: 'props/dock.png',
  56: 'props/barrel-wood.png',
  57: 'props/barrel-wood-2.png',
  58: 'props/bench-2.png',
};

console.log(`\n== islands (${Object.keys(ISLAND_MAP).length}) ==`);
for (const [index, dest] of Object.entries(ISLAND_MAP)) {
  exportIsland(sheet, islands[Number(index)], dest);
}

console.log('\n== hi-res buildings (trimmed to content) ==');
exportTrimmed(readPng(townHallPath), 'buildings/municipality.png');
exportTrimmed(readPng(mansionPath), 'buildings/mansion.png');

console.log('\n== character strips [down, right, up, left] ==');
// boy in the blue hoodie - complete verified set
const boy = composeCharacterSheet(sheet, [30, 32, 31, 33], 'characters/player-boy.png');
// girl with the short ponytail ("Lina") - complete verified set
const lina = composeCharacterSheet(sheet, [48, 50, 51, 49], 'characters/lina.png');
// mayor - sheet has no left view, mirror the right pose
const mayor = composeCharacterSheet(sheet, [38, 39, 40, { isl: 39, flip: true }], 'characters/mayor.png');
// long-ponytail woman - no true back pose, front doubles as 'up'
const woman = composeCharacterSheet(sheet, [34, 35, 34, { isl: 35, flip: true }], 'characters/woman.png');

console.log('\n== spritesheet cells ==');
console.log('player-boy :', JSON.stringify(boy));
console.log('lina       :', JSON.stringify(lina));
console.log('mayor      :', JSON.stringify(mayor));
console.log('woman      :', JSON.stringify(woman));

const newCharacters = readPng(join(OUT, 'characters/yenikarakterler.png'));
const poseColumns = [[0, 300], [300, 570], [570, 840], [840, 1194], [1194, 1458], [1458, 1774]];
const poseRows = [[0, 460], [460, 887]];
if (newCharacters.width !== 1774 || newCharacters.height !== 887) {
  throw new Error('yenikarakterler.png dimensions changed; verify pose regions');
}
const poses = poseRows.flatMap(([top, bottom]) => poseColumns.map(([left, right]) => {
  const bounds = tightBounds({
    width: right - left,
    height: bottom - top,
    data: crop(newCharacters, left, top, right - left, bottom - top),
  });
  if (!bounds) throw new Error(`Empty character pose at ${left},${top}`);
  return { x: left + bounds.x, y: top + bounds.y, w: bounds.w, h: bounds.h };
}));

for (const [name, start] of [
  ['muhendis-aylin', 0],
  ['ciftci-riza', 3],
  ['nuri-amca', 6],
  ['isci-kemal', 9],
]) {
  const result = composeCharacterSheet(
    newCharacters,
    [start, start + 1, start + 2, { isl: start + 1, flip: true }],
    `characters/${name}.png`,
    poses,
  );
  console.log(`${name.padEnd(12)}:`, JSON.stringify(result));
}
console.log('\ndone.');
