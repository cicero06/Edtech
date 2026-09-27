import { writePng } from './png.mjs';

const SIZE = 48;
const SS = 4;
const TIP = { x: 11, y: 9 };
const BULB = { x: 27, y: 28, r: 12.5 };
const OUTLINE = 2.2;
const RIM = 1.4;

const PALETTES = {
  drop: { light: [168, 224, 255], mid: [64, 156, 236], deep: [23, 94, 180], outline: [10, 45, 80], rim: [235, 250, 255] },
  gold: { light: [255, 234, 176], mid: [216, 165, 60], deep: [166, 106, 20], outline: [92, 60, 14], rim: [255, 248, 226] },
};

function tangentPoints(tip, c) {
  const dx = c.x - tip.x, dy = c.y - tip.y;
  const d = Math.hypot(dx, dy);
  const ux = dx / d, uy = dy / d;
  const angle = Math.acos(c.r / d);
  const pts = [];
  for (const sign of [-1, 1]) {
    const a = Math.atan2(uy, ux) + sign * (Math.PI - angle) * -1;
    pts.push({ x: c.x + c.r * Math.cos(a), y: c.y + c.r * Math.sin(a) });
  }
  return pts;
}

function sdTriangle(px, py, a, b, c) {
  const e0 = { x: b.x - a.x, y: b.y - a.y }, e1 = { x: c.x - b.x, y: c.y - b.y }, e2 = { x: a.x - c.x, y: a.y - c.y };
  const v0 = { x: px - a.x, y: py - a.y }, v1 = { x: px - b.x, y: py - b.y }, v2 = { x: px - c.x, y: py - c.y };
  const pq0 = { x: v0.x - e0.x * Math.min(1, Math.max(0, (v0.x * e0.x + v0.y * e0.y) / (e0.x * e0.x + e0.y * e0.y))), y: v0.y - e0.y * Math.min(1, Math.max(0, (v0.x * e0.x + v0.y * e0.y) / (e0.x * e0.x + e0.y * e0.y))) };
  const pq1 = { x: v1.x - e1.x * Math.min(1, Math.max(0, (v1.x * e1.x + v1.y * e1.y) / (e1.x * e1.x + e1.y * e1.y))), y: v1.y - e1.y * Math.min(1, Math.max(0, (v1.x * e1.x + v1.y * e1.y) / (e1.x * e1.x + e1.y * e1.y))) };
  const pq2 = { x: v2.x - e2.x * Math.min(1, Math.max(0, (v2.x * e2.x + v2.y * e2.y) / (e2.x * e2.x + e2.y * e2.y))), y: v2.y - e2.y * Math.min(1, Math.max(0, (v2.x * e2.x + v2.y * e2.y) / (e2.x * e2.x + e2.y * e2.y))) };
  const s = Math.sign(e0.x * e2.y - e0.y * e2.x);
  const d0 = { d: pq0.x * pq0.x + pq0.y * pq0.y, s: s * (v0.x * e0.y - v0.y * e0.x) };
  const d1 = { d: pq1.x * pq1.x + pq1.y * pq1.y, s: s * (v1.x * e1.y - v1.y * e1.x) };
  const d2 = { d: pq2.x * pq2.x + pq2.y * pq2.y, s: s * (v2.x * e2.y - v2.y * e2.x) };
  const m = Math.min(d0.d, Math.min(d1.d, d2.d));
  const ms = m === d0.d ? d0.s : m === d1.d ? d1.s : d2.s;
  return -Math.sqrt(m) * Math.sign(ms);
}

const [pa, pb] = tangentPoints(TIP, BULB);
const AX = { x: BULB.x - TIP.x, y: BULB.y - TIP.y };
const AXLEN = Math.hypot(AX.x, AX.y);

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function shade(px, py, pal) {
  const sdC = Math.hypot(px - BULB.x, py - BULB.y) - BULB.r;
  const sdT = sdTriangle(px, py, TIP, pa, pb);
  const sd = Math.min(sdC, sdT);
  if (sd > OUTLINE) return [0, 0, 0, 0];
  const edge = Math.min(1, Math.max(0, (OUTLINE - sd) / 1.5));
  if (sd > -OUTLINE * 0.6) return [...pal.outline, Math.round(255 * edge)];
  const t = Math.min(1, Math.max(0, ((px - TIP.x) * AX.x + (py - TIP.y) * AX.y) / (AXLEN * AXLEN)));
  const base = t < 0.45 ? lerp3(pal.light, pal.mid, t / 0.45) : lerp3(pal.mid, pal.deep, (t - 0.45) / 0.55);
  const rimK = Math.min(1, Math.max(0, (sd + OUTLINE * 0.6 + RIM) / RIM));
  const col = lerp3(base, pal.rim, (1 - rimK) * 0.55);
  const hx = BULB.x - 4, hy = BULB.y - 5;
  const hi = Math.max(0, 1 - Math.hypot(px - hx, py - hy) / 5.5);
  const final = lerp3(col, [255, 255, 255], hi * hi * 0.5);
  return [...final, 255];
}

function render(name, pal) {
  const hi = SIZE * SS;
  const acc = Buffer.alloc(hi * hi * 4);
  for (let y = 0; y < hi; y++) {
    for (let x = 0; x < hi; x++) {
      const [r, g, b, a] = shade((x + 0.5) / SS, (y + 0.5) / SS, pal);
      const i = (y * hi + x) * 4;
      acc[i] = r; acc[i + 1] = g; acc[i + 2] = b; acc[i + 3] = a;
    }
  }
  const out = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * hi + x * SS + sx) * 4;
          r += acc[i]; g += acc[i + 1]; b += acc[i + 2]; a += acc[i + 3];
        }
      }
      const n = SS * SS, o = (y * SIZE + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
    }
  }
  writePng(new URL(`../public/assets/ui/${name}.png`, import.meta.url).pathname, SIZE, SIZE, out);
  console.log(`wrote assets/ui/${name}.png`);
}

render('cursor-drop', PALETTES.drop);
render('cursor-drop-gold', PALETTES.gold);
