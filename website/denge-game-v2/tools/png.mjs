/**
 * Minimal dependency-free PNG decode/encode for 8-bit RGB / RGBA / grayscale images.
 *
 * Only what the asset slicer needs: no interlacing, no palette, no 16-bit.
 * Kept in-repo so `tools/slice-assets.mjs` can be re-run without installing anything.
 */

import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

/** Reverses the per-scanline PNG filter, in place, for one row. */
function unfilter(type, line, prev, bpp) {
  const stride = line.length;
  switch (type) {
    case 0:
      break;
    case 1:
      for (let x = bpp; x < stride; x++) line[x] = (line[x] + line[x - bpp]) & 0xff;
      break;
    case 2:
      for (let x = 0; x < stride; x++) line[x] = (line[x] + prev[x]) & 0xff;
      break;
    case 3:
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? line[x - bpp] : 0;
        line[x] = (line[x] + ((a + prev[x]) >> 1)) & 0xff;
      }
      break;
    case 4:
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? line[x - bpp] : 0;
        const b = prev[x];
        const c = x >= bpp ? prev[x - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        line[x] = (line[x] + pred) & 0xff;
      }
      break;
    default:
      throw new Error(`Unsupported PNG filter type ${type}`);
  }
}

/**
 * Reads a PNG file into a flat RGBA buffer.
 * @returns {{ width: number, height: number, data: Buffer }} data is width*height*4 RGBA bytes.
 */
export function readPng(path) {
  const raw = readFileSync(path);
  if (!raw.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${path} is not a PNG`);

  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  const idat = [];

  for (let i = 8; i < raw.length; ) {
    const length = raw.readUInt32BE(i);
    const type = raw.subarray(i + 4, i + 8).toString('ascii');
    const body = raw.subarray(i + 8, i + 8 + length);
    i += 12 + length;

    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colorType = body[9];
      if (body[12] !== 0) throw new Error('Interlaced PNGs are not supported');
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (depth !== 8) throw new Error(`Only 8-bit PNGs are supported (got ${depth})`);
  const bpp = CHANNELS[colorType];
  if (!bpp) throw new Error(`Unsupported PNG color type ${colorType}`);

  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const data = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  let pos = 0;

  for (let y = 0; y < height; y++) {
    const filterType = inflated[pos++];
    const line = Buffer.from(inflated.subarray(pos, pos + stride));
    pos += stride;
    unfilter(filterType, line, prev, bpp);

    for (let x = 0; x < width; x++) {
      const s = x * bpp;
      const d = (y * width + x) * 4;
      if (colorType === 6) {
        line.copy(data, d, s, s + 4);
      } else if (colorType === 2) {
        data[d] = line[s];
        data[d + 1] = line[s + 1];
        data[d + 2] = line[s + 2];
        data[d + 3] = 255;
      } else if (colorType === 0) {
        data.fill(line[s], d, d + 3);
        data[d + 3] = 255;
      } else {
        data.fill(line[s], d, d + 3);
        data[d + 3] = line[s + 1];
      }
    }
    prev = line;
  }

  return { width, height, data };
}

function chunk(type, body) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(body.length, 0);
  const name = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([name, body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([head, name, body, crc]);
}

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

/** Writes a flat RGBA buffer out as an 8-bit RGBA PNG. */
export function writePng(path, width, height, data) {
  const stride = width * 4;
  const rawRows = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawRows[y * (stride + 1)] = 0;
    data.copy(rawRows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  writeFileSync(
    path,
    Buffer.concat([
      SIGNATURE,
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(rawRows, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/** Copies a sub-rectangle out of a decoded image into a new RGBA buffer. */
export function crop(image, x, y, width, height) {
  const out = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row++) {
    const src = ((y + row) * image.width + x) * 4;
    image.data.copy(out, row * width * 4, src, src + width * 4);
  }
  return out;
}
