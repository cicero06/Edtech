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

export const WORLD = {
  width: 1920,
  height: 1440,
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

const MIDDLE_BAND_TOP = 360;
const MIDDLE_BAND_BOTTOM = 1160;
const MIDDLE_BAND_HEIGHT = MIDDLE_BAND_BOTTOM - MIDDLE_BAND_TOP;
const PARK_LEFT = 660;
const PARK_RIGHT = 1260;

export const DISTRICTS: readonly District[] = [
  {
    id: 'reservoir',
    label: 'Rezervuar / Baraj',
    x: 0,
    y: 0,
    width: WORLD.width,
    height: MIDDLE_BAND_TOP,
  },
  {
    id: 'agriculture',
    label: 'Tarim Bolgesi',
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
    label: 'Konut Bolgesi',
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
