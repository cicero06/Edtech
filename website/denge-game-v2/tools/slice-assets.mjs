/**
 * Slices the reference town atlas into the individual PNG sprites the game loads.
 *
 * The game itself never touches the atlas: it only ever loads the individual
 * files produced here via `this.load.image()`. This script exists so the slicing
 * is reproducible and reviewable instead of being a one-off manual export.
 *
 *   node tools/slice-assets.mjs
 *
 * Source atlas: public/assets/reference/town-atlas.png
 *   "RPG Town Tile Map" by Luis Zuno (@ansimuz) - see reference/ATTRIBUTION.md
 *
 * Every rectangle below was derived by running connected-component and
 * alpha-profile analysis over the atlas, then visually verifying each crop.
 */

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crop, readPng, writePng } from './png.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS = resolve(root, 'public/assets/reference/town-atlas.png');
const OUT = resolve(root, 'public/assets');

/** [ outputPath, x, y, width, height, note ] */
const SLICES = [
  // ---- buildings -------------------------------------------------------
  ['buildings/town-hall.png', 144, 10, 96, 109, 'large two-storey building, used as the town hall'],
  ['buildings/house.png', 288, 12, 48, 132, 'tall narrow house with flower box'],
  ['buildings/wall-panel.png', 240, 48, 48, 64, 'detached wall / annex section'],

  // ---- nature ----------------------------------------------------------
  ['nature/tree.png', 129, 42, 15, 77, 'single cypress tree'],
  ['nature/tree-cluster.png', 74, 18, 54, 101, 'four overlapping cypress trees'],
  ['nature/hedge.png', 336, 64, 16, 64, 'vertical hedge strip'],

  // ---- agriculture -----------------------------------------------------
  ['agriculture/soil-patch.png', 16, 95, 48, 45, 'bare tilled soil oval'],
  ['agriculture/crop-carrot.png', 24, 80, 32, 21, 'carrot growing on a soil mound'],
  ['agriculture/fence.png', 0, 0, 52, 32, 'wooden fence with hedge posts'],
  ['agriculture/haystack.png', 257, 128, 13, 24, 'haystack'],

  // ---- water / dam -----------------------------------------------------
  ['water/water-tile.png', 164, 200, 16, 16, 'seamless open-water tile'],
  ['water/dam-wall.png', 0, 156, 48, 40, 'masonry wall block'],
  ['water/dam-pillar.png', 64, 156, 16, 40, 'narrow masonry pillar'],
  ['water/dam-basin.png', 2, 208, 94, 68, 'masonry enclosure / spillway basin'],

  // ---- ground ----------------------------------------------------------
  ['ground/path-tile.png', 257, 178, 12, 12, 'seamless cobblestone path tile'],

  // ---- props -----------------------------------------------------------
  ['props/chest.png', 130, 130, 13, 12, 'wooden chest'],
  ['props/barrel.png', 146, 128, 12, 16, 'barrel / crate'],
];

const atlas = readPng(ATLAS);
console.log(`atlas: ${ATLAS} (${atlas.width}x${atlas.height})`);

let written = 0;
for (const [rel, x, y, w, h, note] of SLICES) {
  if (x < 0 || y < 0 || x + w > atlas.width || y + h > atlas.height) {
    throw new Error(`slice ${rel} (${x},${y},${w},${h}) falls outside the atlas`);
  }

  const pixels = crop(atlas, x, y, w, h);

  let opaque = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) opaque++;
  if (opaque === 0) throw new Error(`slice ${rel} is fully transparent - wrong coordinates?`);

  const dest = resolve(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writePng(dest, w, h, pixels);

  const fill = ((opaque / (w * h)) * 100).toFixed(0);
  console.log(`  ${rel.padEnd(34)} ${String(w).padStart(3)}x${String(h).padStart(3)}  ${fill.padStart(3)}% opaque  - ${note}`);
  written++;
}

console.log(`\n${written} sprites written to public/assets/`);
