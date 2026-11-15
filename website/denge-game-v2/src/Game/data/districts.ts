/**
 * Denge Kasabasi is divided into five gameplay districts. They are plain
 * rectangles for now; later systems (missions, evidence, scenario gating) can
 * key off `DistrictId` without any coordinate checks leaking into the scene.
 *
 * Required spatial layout:
 *
 *                      REZERVUAR / BARAJ            (north)
 *                              |
 *       TARIM ------------- MERKEZ PARK ------------- KONUT
 *       (west)                 |                      (east)
 *                              |
 *                        BELEDIYE                    (south)
 *
 * The rectangles tile the whole world with no gaps and no overlaps, so every
 * world position resolves to exactly one district.
 */

/**
 * The town was grown 25 % (user: "kasaba büyüsün, aradaki mesafeler
 * artsın") — the original layout data is authored in the old 1920×1440
 * space and scaled by TOWN_SCALE when the world is built; sprites keep their
 * size, so everything gets more room around it.
 */
export const TOWN_SCALE = 1.25;
/** Old-layout coordinate → world coordinate. */
export const sc = (v: number) => Math.round(v * TOWN_SCALE);

export const WORLD = {
  width: 2400,
  height: 1800,
} as const;

/**
 * The Unity build grew the map 192 px north for the big reservoir lake
 * (Unity y = (720 - web y) / 32, top boundary 28.5 → y = -192). Everything
 * that already existed keeps its coordinates; the lake lives at y < 0.
 */
export const WORLD_TOP = -240;

/** Full playable/camera rectangle including the northern lake. */
export const WORLD_BOUNDS = {
  x: 0,
  y: WORLD_TOP,
  width: WORLD.width,
  height: WORLD.height - WORLD_TOP,
} as const;

export type DistrictId = 'reservoir' | 'agriculture' | 'park' | 'residential' | 'municipality';

export interface District {
  id: DistrictId;
  /** Turkish display name. */
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIDDLE_BAND_TOP = 450;
const MIDDLE_BAND_BOTTOM = 1450;
const MIDDLE_BAND_HEIGHT = MIDDLE_BAND_BOTTOM - MIDDLE_BAND_TOP;
const PARK_LEFT = 825;
const PARK_RIGHT = 1575;

export const DISTRICTS: readonly District[] = [
  {
    id: 'reservoir',
    label: 'Rezervuar / Baraj',
    x: 0,
    y: WORLD_TOP,
    width: WORLD.width,
    height: MIDDLE_BAND_TOP - WORLD_TOP,
  },
  {
    id: 'agriculture',
    label: 'Tarım Bölgesi',
    x: 0,
    y: MIDDLE_BAND_TOP,
    width: PARK_LEFT,
    height: MIDDLE_BAND_HEIGHT,
  },
  {
    id: 'park',
    label: 'Merkez Park',
    x: PARK_LEFT,
    y: MIDDLE_BAND_TOP,
    width: PARK_RIGHT - PARK_LEFT,
    height: MIDDLE_BAND_HEIGHT,
  },
  {
    id: 'residential',
    label: 'Konut Bölgesi',
    x: PARK_RIGHT,
    y: MIDDLE_BAND_TOP,
    width: WORLD.width - PARK_RIGHT,
    height: MIDDLE_BAND_HEIGHT,
  },
  {
    id: 'municipality',
    label: 'Belediye',
    x: 0,
    y: MIDDLE_BAND_BOTTOM,
    width: WORLD.width,
    height: WORLD.height - MIDDLE_BAND_BOTTOM,
  },
] as const;

/** The park is the navigation hub; everything else radiates from it. */
export const PARK_CENTER = {
  x: (PARK_LEFT + PARK_RIGHT) / 2,
  y: (MIDDLE_BAND_TOP + MIDDLE_BAND_BOTTOM) / 2,
} as const;

/** Where the player starts: on the park's south path, facing the hub. */
export const PLAYER_SPAWN = {
  x: PARK_CENTER.x,
  y: PARK_CENTER.y + 180,
} as const;

/** Width of the two cobblestone trunk roads that cross at the park. */
export const ROAD_WIDTH = 88;

export function districtAt(x: number, y: number): District | null {
  for (const district of DISTRICTS) {
    if (
      x >= district.x &&
      x < district.x + district.width &&
      y >= district.y &&
      y < district.y + district.height
    ) {
      return district;
    }
  }
  return null;
}
