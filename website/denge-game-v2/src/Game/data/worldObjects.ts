/**
 * Declarative description of the Denge Kasabasi world.
 *
 * `GameScene` only reads these arrays and turns them into sprites - it contains
 * no hard-coded placement of its own. Moving a building means editing data here,
 * never touching the scene.
 *
 * The world is built from the smooth illustrated PNGs sliced out of
 * `allassets.png` by `tools/slice-allassets.mjs` (the older pixel-art set is
 * still in the manifest as fallback but is not placed any more).
 *
 * Coordinate conventions
 * ----------------------
 * - Every sorted sprite is drawn with origin (0.5, 1), so `y` is the object's
 *   BASE LINE (where it meets the ground). That makes `depth = y` correct for
 *   free, and makes "walking behind a tree" work without extra bookkeeping.
 * - `CollisionBox` is expressed relative to that base line: by default the box
 *   sits directly on top of it (`offsetY = -height / 2`), i.e. a footprint.
 * - `GroundLayer` and `CollisionZone` rects are TOP-LEFT based, because that is
 *   how you naturally think about floor areas.
 * - `scale` shrinks the source art to in-world size. The smooth assets are
 *   drawn ~2x larger than the old pixel set, so most sit around 0.5-0.6.
 */

import { TextureKeys, type TextureKey } from './assets';
import { PARK_CENTER, ROAD_WIDTH, WORLD, WORLD_TOP, type DistrictId } from './districts';

/** How an object's render order is decided. */
export type DepthMode =
  /** Flat floor decal - uses the explicit `depth` value. */
  | 'ground'
  /** Upright object - `depth` becomes its base `y`, so actors sort against it. */
  | 'sorted';

export interface CollisionBox {
  width: number;
  height: number;
  /** Box centre offset from the object's x. Default 0. */
  offsetX?: number;
  /** Box centre offset from the object's base y. Default `-height / 2`. */
  offsetY?: number;
}

export interface WorldObject {
  id: string;
  textureKey: TextureKey;
  x: number;
  /** Base line - where the sprite touches the ground. */
  y: number;
  scale?: number;
  depthMode?: DepthMode;
  /** Only used when `depthMode` is `'ground'`. */
  depth?: number;
  flipX?: boolean;
  /** Omit or set null for decoration the player can walk through. */
  collision?: CollisionBox | null;
  district: DistrictId;
}

export interface GroundLayer {
  id: string;
  textureKey: TextureKey;
  /** Top-left corner of the displayed area. */
  x: number;
  y: number;
  /** Displayed area size, in world pixels. */
  width: number;
  height: number;
  depth: number;
  /**
   * Vertical squash applied to the tile texture. Used for `road-dash`, whose
   * 127px texture carries both edge lines that must survive into an 88px road.
   */
  scaleY?: number;
  /** Texture-to-world scale of the repeating tile (default 1). */
  tileScale?: number;
  /** Soft edge in world px — the layer fades into whatever lies beneath. */
  feather?: number;
  /**
   * Draw the tile turned 90° — lets the horizontal road tile pave the
   * north-south ring roads so every road shares one look.
   */
  vertical?: boolean;
}

/** A collision rectangle with no sprite of its own (water, fields, ...). */
export interface CollisionZone {
  id: string;
  /** Top-left corner. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fixed depths for the flat floor layers, all far below any actor. */
export const GroundDepth = {
  BASE: -1000,
  DISTRICT_TINT: -900,
  WATER: -880,
  ROAD: -850,
  DECAL: -800,
} as const;

// ---------------------------------------------------------------------------
// Layout guides
// ---------------------------------------------------------------------------

/**
 * The reservoir is one painted panorama ported from Unity
 * (reservoir_upper_panorama: lake, beaches, dock, dam, spillway basin),
 * placed exactly as Unity's Ground_Reservoir_Lake (1984 × 640 world px, top-left
 * at (-2, -208)) and cropped at the world's east edge → 1922 px wide. The
 * bottom edge is feathered into the town grass.
 */
export const RESERVOIR_PANORAMA = { x: -2, y: -208, width: 1922, height: 640 } as const;

/** Open lake water (16 px rows, world coords) — derived from the lake mask. */
const LAKE_WATER_RECTS: readonly (readonly [number, number, number, number])[] = [[382, -208, 1024, 16], [382, -192, 1024, 16], [382, -176, 1024, 16], [382, -160, 1024, 16], [398, -144, 1008, 16], [398, -128, 1008, 16], [398, -112, 1008, 16], [382, -96, 1040, 16], [382, -80, 1040, 16], [350, -64, 1104, 16], [174, -48, 16, 16], [318, -48, 1168, 16], [158, -32, 1504, 16], [126, -16, 1568, 16], [110, 0, 1600, 16], [110, 16, 1616, 16], [110, 32, 1600, 16], [126, 48, 1552, 16], [126, 64, 1344, 16], [190, 80, 1232, 16], [238, 96, 1152, 16], [398, 112, 976, 16], [446, 128, 912, 16], [462, 144, 896, 16], [526, 160, 832, 16], [558, 176, 784, 16]];

/** Shore tree spots on the grass/beach edge (from the lake art), y = base line. */
const SHORE_TREE_SPOTS: readonly (readonly [number, number])[] = [[304, -178], [1486, -172], [202, -136], [376, -130], [1606, -130], [262, -130], [1546, -124], [1696, -106], [112, -106], [34, -94], [1786, -88], [1846, -58], [1630, -40], [-2, -4], [1732, 8], [1876, 50], [1666, 62], [1600, 68], [-2, 80], [1834, 98], [1780, 122], [1714, 146], [1360, 146], [70, 152], [1522, 158], [1654, 164], [1456, 170], [1582, 176], [490, 176], [256, 188], [178, 194], [316, 200], [388, 206], [1438, 242]];

/** The dam sprite: world top-left + size; the spillway basin is its lower middle. */
export const DAM = { x: 560, y: 100, width: 800, height: 380 } as const;


/**
 * The north-south street is drawn with `road-straight` (194px tile: ~75px of
 * asphalt on the west + ~119px of pavement promenade on the east, park side).
 * The asphalt centre sits ~50px right of the tile's left edge, i.e. ~x963.
 */
const STREET_X = 913;
const STREET_WIDTH = 194;
/** Starts at the spillway basin's lower edge in the lake panorama. */
const STREET_TOP = 470;
const STREET_BOTTOM = 1290;

/** East-west asphalt avenue, drawn with the dashed-centre road tile. */
/** Main east-west road — now runs ring road to ring road like the Unity map. */
const AVENUE = { x: 40, y: PARK_CENTER.y - ROAD_WIDTH / 2, width: 1880, height: ROAD_WIDTH };

/**
 * Ring roads and side streets (Unity map layout): every road joins another,
 * nothing dead-ends in the grass. All use the dashed avenue tile.
 */
const RING_WEST = { x: 40, y: AVENUE.y, width: ROAD_WIDTH, height: 1440 - AVENUE.y };
const RING_EAST = { x: 1832, y: 400, width: ROAD_WIDTH, height: 1040 };
const NORTH_STREET = { x: 1107, y: 400, width: 1920 - 1107, height: ROAD_WIDTH };
const SOUTH_ROAD_Y = 1180;
const SOUTH_ROAD_WEST = { x: 40, y: SOUTH_ROAD_Y, width: 650 - 40, height: ROAD_WIDTH };
const SOUTH_ROAD_EAST = { x: 1270, y: SOUTH_ROAD_Y, width: 1832 - 1270, height: ROAD_WIDTH };

// ---------------------------------------------------------------------------
// Small generators - keep the data declarative without 200 literal entries
// ---------------------------------------------------------------------------

interface RunOptions {
  idPrefix: string;
  textureKey: TextureKey;
  district: DistrictId;
  /** Base y for every item in the run. */
  y: number;
  from: number;
  to: number;
  step: number;
  collision?: CollisionBox | null;
  depthMode?: DepthMode;
  depth?: number;
  scale?: number;
}

/** A horizontal row of the same sprite. */
function row(options: RunOptions): WorldObject[] {
  const items: WorldObject[] = [];
  let index = 0;
  for (let x = options.from; x <= options.to; x += options.step) {
    items.push({
      id: `${options.idPrefix}-${index++}`,
      textureKey: options.textureKey,
      x,
      y: options.y,
      scale: options.scale,
      depthMode: options.depthMode,
      depth: options.depth,
      collision: options.collision,
      district: options.district,
    });
  }
  return items;
}

interface GridOptions {
  idPrefix: string;
  textureKey: TextureKey;
  district: DistrictId;
  xs: number[];
  ys: number[];
  depthMode?: DepthMode;
  depth?: number;
  collision?: CollisionBox | null;
  scale?: number;
}

/** A field-style grid of the same sprite. */
function grid(options: GridOptions): WorldObject[] {
  const items: WorldObject[] = [];
  let index = 0;
  for (const y of options.ys) {
    for (const x of options.xs) {
      items.push({
        id: `${options.idPrefix}-${index++}`,
        textureKey: options.textureKey,
        x,
        y,
        scale: options.scale,
        depthMode: options.depthMode,
        depth: options.depth,
        collision: options.collision,
        district: options.district,
      });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Reusable footprints (world pixels, after the chosen display scale)
// ---------------------------------------------------------------------------

const Footprint = {
  MUNICIPALITY: { width: 190, height: 26 } satisfies CollisionBox,
  HOUSE: { width: 118, height: 22 } satisfies CollisionBox,
  APARTMENT: { width: 100, height: 22 } satisfies CollisionBox,
  SHOP: { width: 100, height: 20 } satisfies CollisionBox,
  MANSION: { width: 145, height: 26 } satisfies CollisionBox,
  FARMHOUSE: { width: 128, height: 24 } satisfies CollisionBox,
  GREENHOUSE: { width: 110, height: 26 } satisfies CollisionBox,
  WINDMILL: { width: 30, height: 18 } satisfies CollisionBox,
  TREATMENT: { width: 140, height: 28 } satisfies CollisionBox,
  DOCK: { width: 60, height: 14 } satisfies CollisionBox,
  TREE: { width: 15, height: 12 } satisfies CollisionBox,
  CYPRESS: { width: 14, height: 12 } satisfies CollisionBox,
  HEDGE_ROW: { width: 104, height: 20 } satisfies CollisionBox,
  FOUNTAIN: { width: 70, height: 22 } satisfies CollisionBox,
  BENCH: { width: 50, height: 16 } satisfies CollisionBox,
  BENCH_2: { width: 42, height: 14 } satisfies CollisionBox,
  LAMP: { width: 12, height: 10 } satisfies CollisionBox,
  SIGN: { width: 18, height: 10 } satisfies CollisionBox,
  PLANTER: { width: 44, height: 20 } satisfies CollisionBox,
  TRASH: { width: 20, height: 14 } satisfies CollisionBox,
  CAR: { width: 30, height: 55 } satisfies CollisionBox,
  TRACTOR: { width: 36, height: 56 } satisfies CollisionBox,
  HAYSTACK: { width: 38, height: 16 } satisfies CollisionBox,
  ROCKS: { width: 56, height: 22 } satisfies CollisionBox,
  BUSH: { width: 44, height: 16 } satisfies CollisionBox,
  BUSH_SMALL: { width: 26, height: 14 } satisfies CollisionBox,
  FLOWER_BUSH: { width: 46, height: 18 } satisfies CollisionBox,
  CRATE: { width: 36, height: 16 } satisfies CollisionBox,
  BARREL: { width: 22, height: 12 } satisfies CollisionBox,
} as const;

// ---------------------------------------------------------------------------
// GROUND - base grass, district tints, water, streets
// ---------------------------------------------------------------------------

export const GROUND_LAYERS: readonly GroundLayer[] = [
  // Whole-world grass base. Everything else is painted on top of this.
  {
    id: 'ground-base',
    textureKey: TextureKeys.GROUND_GRASS,
    x: 0,
    y: WORLD_TOP,
    width: WORLD.width,
    height: WORLD.height - WORLD_TOP,
    depth: GroundDepth.BASE,
    tileScale: 0.5,
  },
  // Drier, paler grass over the farmland to read as a different district.
  {
    id: 'ground-agriculture',
    textureKey: TextureKeys.GROUND_GRASS_DRY,
    x: 0,
    y: 360,
    width: 660,
    height: 800,
    depth: GroundDepth.DISTRICT_TINT,
    tileScale: 0.5,
    feather: 70,
  },
  // Lush grass for the central park.
  {
    id: 'ground-park',
    textureKey: TextureKeys.GROUND_GRASS_LUSH,
    x: 660,
    y: 360,
    width: 600,
    height: 800,
    depth: GroundDepth.DISTRICT_TINT,
    tileScale: 0.5,
    feather: 40,
  },
  // North-south street: dam -> park -> town hall (asphalt + promenade tile).
  {
    id: 'road-vertical',
    textureKey: TextureKeys.ROAD_STRAIGHT,
    x: STREET_X,
    y: STREET_TOP,
    width: STREET_WIDTH,
    height: STREET_BOTTOM - STREET_TOP,
    depth: GroundDepth.ROAD,
  },
  // Ring roads first (one step below) so the horizontal streets cap the joints.
  { id: 'road-ring-west', textureKey: TextureKeys.ROAD_DASH, ...RING_WEST, depth: GroundDepth.ROAD - 2, scaleY: ROAD_WIDTH / 127, vertical: true },
  { id: 'road-ring-east', textureKey: TextureKeys.ROAD_DASH, ...RING_EAST, depth: GroundDepth.ROAD - 2, scaleY: ROAD_WIDTH / 127, vertical: true },
  // East-west avenue: ring road -> farmland -> park -> housing -> ring road.
  {
    id: 'road-horizontal',
    textureKey: TextureKeys.ROAD_DASH,
    ...AVENUE,
    depth: GroundDepth.ROAD,
    scaleY: AVENUE.height / 127,
  },
  { id: 'road-north-street', textureKey: TextureKeys.ROAD_DASH, ...NORTH_STREET, depth: GroundDepth.ROAD, scaleY: ROAD_WIDTH / 127 },
  { id: 'road-south-west', textureKey: TextureKeys.ROAD_DASH, ...SOUTH_ROAD_WEST, depth: GroundDepth.ROAD, scaleY: ROAD_WIDTH / 127 },
  { id: 'road-south-east', textureKey: TextureKeys.ROAD_DASH, ...SOUTH_ROAD_EAST, depth: GroundDepth.ROAD, scaleY: ROAD_WIDTH / 127 },
  // Crossings: plain asphalt over both roads so lane lines stop at the joint.
  ...[
    [RING_WEST.x, AVENUE.y],
    [RING_EAST.x, AVENUE.y],
    [RING_EAST.x, NORTH_STREET.y],
    [RING_WEST.x, SOUTH_ROAD_Y],
    [RING_EAST.x, SOUTH_ROAD_Y],
  ].map(([x, y]) => ({
    id: `road-junction-${x}-${y}`,
    textureKey: TextureKeys.ROAD_JUNCTION,
    x: x + 6,
    y: y + 6,
    width: ROAD_WIDTH - 12,
    height: ROAD_WIDTH - 12,
    depth: GroundDepth.ROAD + 1,
    tileScale: 0.6,
  })),
  // Farm tracks: farmhouse door -> avenue, avenue -> vegetable plot.
  { id: 'path-farmhouse', textureKey: TextureKeys.GROUND_DIRT, x: 190, y: 652, width: 40, height: 66, depth: GroundDepth.ROAD - 5, tileScale: 0.25, feather: 6 },
  { id: 'path-veg', textureKey: TextureKeys.GROUND_DIRT, x: 380, y: 792, width: 40, height: 128, depth: GroundDepth.ROAD - 5, tileScale: 0.25, feather: 6 },
  // Town hall plaza keeps the cobblestone paving - civic square, not a street.
  {
    id: 'road-plaza',
    textureKey: TextureKeys.GROUND_PATH,
    x: 650,
    y: 1225,
    width: 620,
    height: 200,
    depth: GroundDepth.ROAD,
    tileScale: 0.15,
    feather: 8,
  },
] as const;

/** Deep water and fenced-off field interiors are not walkable. */
export const COLLISION_ZONES: readonly CollisionZone[] = [
  // Open lake water — beaches stay walkable.
  ...LAKE_WATER_RECTS.map(([x, y, width, height]) => ({ id: `lake-${x}-${y}`, x, y, width, height })),
  // Dam wall (left wing, gates, right wing) and the spillway basin.
  { id: 'dam-wall', x: DAM.x + 10, y: DAM.y + 40, width: DAM.width - 20, height: 200 },
  { id: 'dam-basin', x: DAM.x + 270, y: DAM.y + 240, width: 300, height: 110 },
  // The crop plots ship with fences baked into the art - block the whole
  // decal so the player stops at the fence line instead of walking over it.
  { id: 'field-wheat-fence', x: 336, y: 507, width: 188, height: 187 },
  { id: 'field-veg-fence', x: 317, y: 917, width: 165, height: 186 },
] as const;

// ---------------------------------------------------------------------------
// BUILDINGS
// ---------------------------------------------------------------------------

export const BUILDINGS: readonly WorldObject[] = [
  // --- municipality (south): the flag-bearing belediye ---
  {
    id: 'municipality',
    textureKey: TextureKeys.MUNICIPALITY,
    x: PARK_CENTER.x,
    y: 1400,
    scale: 0.62,
    collision: Footprint.MUNICIPALITY,
    district: 'municipality',
  },

  // --- agriculture (west) ---
  {
    id: 'farmhouse',
    textureKey: TextureKeys.FARMHOUSE,
    x: 210,
    y: 650,
    scale: 0.55,
    collision: Footprint.FARMHOUSE,
    district: 'agriculture',
  },
  {
    id: 'greenhouse',
    textureKey: TextureKeys.GREENHOUSE,
    x: 540,
    y: 810,
    scale: 0.6,
    collision: Footprint.GREENHOUSE,
    district: 'agriculture',
  },
  {
    id: 'windmill',
    textureKey: TextureKeys.WINDMILL,
    x: 185,
    y: 830,
    scale: 0.62,
    collision: Footprint.WINDMILL,
    district: 'agriculture',
  },

  // --- residential (east): houses, a corner shop, apartments, one mansion ---
  {
    id: 'shop-corner',
    textureKey: TextureKeys.SHOP,
    x: 1310,
    y: 800,
    scale: 0.58,
    collision: Footprint.SHOP,
    district: 'residential',
  },
  ...row({
    idPrefix: 'house-north',
    textureKey: TextureKeys.HOUSE_RED,
    district: 'residential',
    y: 640,
    from: 1360,
    to: 1680,
    step: 160,
    scale: 0.55,
    collision: Footprint.HOUSE,
  }),
  {
    id: 'apartment-north',
    textureKey: TextureKeys.APARTMENT,
    x: 1820,
    y: 640,
    scale: 0.55,
    collision: Footprint.APARTMENT,
    district: 'residential',
  },
  ...row({
    idPrefix: 'house-south',
    textureKey: TextureKeys.HOUSE_RED,
    district: 'residential',
    y: 1100,
    from: 1360,
    to: 1840,
    step: 160,
    scale: 0.55,
    collision: Footprint.HOUSE,
  }),
  {
    id: 'mansion-east',
    textureKey: TextureKeys.MANSION,
    x: 1740,
    // Was y 870: its roof covered the avenue. Now it sits on the lawn below.
    y: 962,
    scale: 0.16,
    collision: Footprint.MANSION,
    district: 'residential',
  },
] as const;

// ---------------------------------------------------------------------------
// WATER / DAM INFRASTRUCTURE (north)
// ---------------------------------------------------------------------------

export const WATERWORKS: readonly WorldObject[] = [
  {
    id: 'treatment-plant',
    textureKey: TextureKeys.TREATMENT_PLANT,
    x: 430,
    y: 352,
    scale: 0.62,
    collision: Footprint.TREATMENT,
    district: 'reservoir',
  },
  {
    id: 'shore-rocks-west',
    textureKey: TextureKeys.ROCKS,
    x: 290,
    y: 335,
    scale: 0.6,
    collision: Footprint.ROCKS,
    district: 'reservoir',
  },
  {
    id: 'shore-rocks-east',
    textureKey: TextureKeys.ROCKS,
    x: 1500,
    y: 340,
    scale: 0.6,
    collision: Footprint.ROCKS,
    district: 'reservoir',
  },
] as const;

// ---------------------------------------------------------------------------
// NATURE - trees ring the districts; the park mixes species per quadrant
// ---------------------------------------------------------------------------

export const NATURE: readonly WorldObject[] = [
  // --- park: four quadrants, kept clear of both streets ---
  ...grid({
    idPrefix: 'park-tree-nw',
    textureKey: TextureKeys.TREE_ROUND,
    district: 'park',
    xs: [700, 780, 860],
    ys: [450, 560, 660],
    scale: 0.5,
    collision: Footprint.TREE,
  }),
  ...grid({
    idPrefix: 'park-tree-ne',
    textureKey: TextureKeys.TREE_BLOSSOM,
    district: 'park',
    xs: [1120, 1190, 1240],
    ys: [450, 560, 660],
    scale: 0.55,
    collision: Footprint.TREE,
  }),
  ...grid({
    idPrefix: 'park-tree-sw',
    textureKey: TextureKeys.TREE_ROUND_2,
    district: 'park',
    xs: [700, 780, 860],
    ys: [900, 1010, 1120],
    scale: 0.52,
    collision: Footprint.TREE,
  }),
  // South-east quadrant is thinned out to leave room around Lina.
  ...grid({
    idPrefix: 'park-tree-se',
    textureKey: TextureKeys.TREE_BLOSSOM,
    district: 'park',
    xs: [1160, 1230],
    ys: [950, 1080],
    scale: 0.55,
    collision: Footprint.TREE,
  }),

  // --- residential: cypresses along the west edge, round trees at corners ---
  ...grid({
    idPrefix: 'housing-tree',
    textureKey: TextureKeys.TREE_ROUND_2,
    district: 'residential',
    xs: [1300, 1890],
    ys: [520, 1000],
    scale: 0.52,
    collision: Footprint.TREE,
  }),
  {
    id: 'shop-cypress-a',
    textureKey: TextureKeys.TREE_CYPRESS,
    x: 1275,
    y: 745,
    scale: 0.55,
    collision: Footprint.CYPRESS,
    district: 'residential',
  },
  {
    id: 'shop-cypress-b',
    textureKey: TextureKeys.TREE_CYPRESS,
    x: 1275,
    y: 855,
    scale: 0.55,
    collision: Footprint.CYPRESS,
    district: 'residential',
  },

  // --- municipality: trees framing the civic district ---
  ...grid({
    idPrefix: 'civic-tree',
    textureKey: TextureKeys.TREE_ROUND_2,
    district: 'municipality',
    xs: [420, 560, 1360, 1500],
    ys: [1300, 1410],
    scale: 0.52,
    collision: Footprint.TREE,
  }),

  // --- agriculture: pine windbreak along the western edge ---
  ...grid({
    idPrefix: 'farm-pine',
    textureKey: TextureKeys.TREE_PINE,
    district: 'agriculture',
    xs: [45, 110],
    ys: [450, 570, 690, 910, 1030, 1150],
    scale: 0.52,
    collision: Footprint.TREE,
  }),

  // --- park bushes & flower dressing ---
  {
    id: 'park-bush-nw',
    textureKey: TextureKeys.FLOWER_BUSH,
    x: 730,
    y: 700,
    scale: 0.55,
    collision: Footprint.FLOWER_BUSH,
    district: 'park',
  },
  {
    id: 'park-bush-ne',
    textureKey: TextureKeys.BUSH,
    x: 1170,
    y: 700,
    scale: 0.6,
    collision: Footprint.BUSH,
    district: 'park',
  },
  {
    id: 'park-bush-se',
    textureKey: TextureKeys.FLOWER_BUSH,
    x: 1200,
    y: 900,
    scale: 0.55,
    collision: Footprint.FLOWER_BUSH,
    district: 'park',
  },
  {
    id: 'park-bush-sw',
    textureKey: TextureKeys.BUSH_SMALL,
    x: 810,
    y: 860,
    scale: 0.6,
    collision: Footprint.BUSH_SMALL,
    district: 'park',
  },

  // --- grass-patch decals (walkable) ---
  ...grid({
    idPrefix: 'grass-patch',
    textureKey: TextureKeys.GRASS_PATCH,
    district: 'park',
    xs: [740, 1120],
    ys: [490, 960],
    scale: 0.7,
    depthMode: 'ground',
    depth: GroundDepth.DECAL,
    collision: null,
  }),
] as const;

// ---------------------------------------------------------------------------
// AGRICULTURE - painted field plots + farm dressing
// ---------------------------------------------------------------------------

export const AGRICULTURE: readonly WorldObject[] = [
  // The big fenced crop plots are floor decals; COLLISION_ZONES blocks the
  // fenced interior while the south entry strip stays walkable.
  {
    id: 'field-wheat',
    textureKey: TextureKeys.FIELD_WHEAT,
    x: 430,
    y: 694,
    scale: 0.95,
    depthMode: 'ground',
    depth: GroundDepth.DECAL,
    collision: null,
    district: 'agriculture',
  },
  {
    id: 'field-veg',
    textureKey: TextureKeys.FIELD_VEG,
    x: 400,
    y: 1103,
    scale: 0.95,
    depthMode: 'ground',
    depth: GroundDepth.DECAL,
    collision: null,
    district: 'agriculture',
  },
  // Farm dressing.
  {
    id: 'farm-tractor',
    textureKey: TextureKeys.TRACTOR,
    x: 315,
    y: 700,
    scale: 0.55,
    collision: Footprint.TRACTOR,
    district: 'agriculture',
  },
  ...row({
    idPrefix: 'farm-haystack',
    textureKey: TextureKeys.HAYSTACK_BIG,
    district: 'agriculture',
    y: 740,
    from: 480,
    to: 590,
    step: 55,
    scale: 0.7,
    collision: Footprint.HAYSTACK,
  }),
  {
    id: 'farm-haystack-south',
    textureKey: TextureKeys.HAYSTACK_BIG,
    x: 500,
    y: 1090,
    scale: 0.7,
    collision: Footprint.HAYSTACK,
    district: 'agriculture',
  },
  {
    id: 'farm-rocks',
    textureKey: TextureKeys.ROCKS,
    x: 600,
    y: 880,
    scale: 0.6,
    collision: Footprint.ROCKS,
    district: 'agriculture',
  },
  {
    id: 'farm-crate-a',
    textureKey: TextureKeys.CRATE,
    x: 285,
    y: 715,
    scale: 0.6,
    collision: Footprint.CRATE,
    district: 'agriculture',
  },
  {
    id: 'farm-barrel-a',
    textureKey: TextureKeys.BARREL_WOOD,
    x: 250,
    y: 690,
    scale: 0.65,
    collision: Footprint.BARREL,
    district: 'agriculture',
  },
  {
    id: 'farm-barrel-b',
    textureKey: TextureKeys.BARREL_WOOD_2,
    x: 268,
    y: 700,
    scale: 0.65,
    collision: Footprint.BARREL,
    district: 'agriculture',
  },
] as const;

// ---------------------------------------------------------------------------
// PROPS - fountain plaza, street furniture, parked vehicles
// ---------------------------------------------------------------------------

export const PROPS: readonly WorldObject[] = [
  // --- the fountain anchors the park crossroads; traffic flows around it ---
  {
    id: 'park-fountain',
    textureKey: TextureKeys.FOUNTAIN,
    x: PARK_CENTER.x,
    y: 790,
    scale: 0.55,
    collision: Footprint.FOUNTAIN,
    district: 'park',
  },

  // --- benches facing the fountain, off the asphalt ---
  {
    id: 'bench-west-south',
    textureKey: TextureKeys.BENCH,
    x: 870,
    y: 830,
    scale: 0.55,
    collision: Footprint.BENCH,
    district: 'park',
  },
  {
    id: 'bench-east-south',
    textureKey: TextureKeys.BENCH,
    x: 1050,
    y: 830,
    scale: 0.55,
    collision: Footprint.BENCH,
    district: 'park',
  },
  {
    id: 'bench-west-north',
    textureKey: TextureKeys.BENCH_2,
    x: 870,
    y: 695,
    scale: 0.6,
    collision: Footprint.BENCH_2,
    district: 'park',
  },
  {
    id: 'bench-east-north',
    textureKey: TextureKeys.BENCH_2,
    x: 1050,
    y: 695,
    scale: 0.6,
    collision: Footprint.BENCH_2,
    district: 'park',
  },

  // --- street lamps along the promenade ---
  {
    id: 'lamp-north',
    textureKey: TextureKeys.STREET_LAMP,
    x: 900,
    y: 500,
    scale: 0.5,
    collision: Footprint.LAMP,
    district: 'park',
  },
  {
    id: 'lamp-north-east',
    textureKey: TextureKeys.STREET_LAMP,
    x: 1025,
    y: 500,
    scale: 0.5,
    collision: Footprint.LAMP,
    district: 'park',
  },
  {
    id: 'lamp-south',
    textureKey: TextureKeys.STREET_LAMP,
    x: 900,
    y: 1050,
    scale: 0.5,
    collision: Footprint.LAMP,
    district: 'park',
  },
  {
    id: 'lamp-south-east',
    textureKey: TextureKeys.STREET_LAMP,
    x: 1025,
    y: 1050,
    scale: 0.5,
    collision: Footprint.LAMP,
    district: 'park',
  },

  // --- park entrance signs ---
  {
    id: 'sign-north',
    textureKey: TextureKeys.SIGN,
    x: 890,
    y: 660,
    scale: 0.5,
    collision: Footprint.SIGN,
    district: 'park',
  },
  {
    id: 'sign-south',
    textureKey: TextureKeys.SIGN,
    x: 890,
    y: 865,
    scale: 0.5,
    collision: Footprint.SIGN,
    district: 'park',
  },

  // --- planters dressing the crossroads corners ---
  {
    id: 'planter-nw',
    textureKey: TextureKeys.PLANTER,
    x: 860,
    y: 715,
    scale: 0.55,
    collision: Footprint.PLANTER,
    district: 'park',
  },
  {
    id: 'planter-se',
    textureKey: TextureKeys.PLANTER,
    x: 1070,
    y: 815,
    scale: 0.55,
    collision: Footprint.PLANTER,
    district: 'park',
  },

  // --- a crate tucked behind the east bench ---
  {
    id: 'park-crate',
    textureKey: TextureKeys.CRATE,
    x: 1095,
    y: 705,
    scale: 0.6,
    collision: Footprint.CRATE,
    district: 'park',
  },

  // --- municipality plaza dressing ---
  ...row({
    idPrefix: 'civic-hedge-west',
    textureKey: TextureKeys.HEDGE_ROW,
    district: 'municipality',
    y: 1230,
    from: 680,
    to: 790,
    step: 110,
    scale: 0.7,
    collision: Footprint.HEDGE_ROW,
  }),
  ...row({
    idPrefix: 'civic-hedge-east',
    textureKey: TextureKeys.HEDGE_ROW,
    district: 'municipality',
    y: 1230,
    from: 1130,
    to: 1240,
    step: 110,
    scale: 0.7,
    collision: Footprint.HEDGE_ROW,
  }),
  {
    id: 'civic-bench-west',
    textureKey: TextureKeys.BENCH,
    x: 740,
    y: 1295,
    scale: 0.55,
    collision: Footprint.BENCH,
    district: 'municipality',
  },
  {
    id: 'civic-bench-east',
    textureKey: TextureKeys.BENCH,
    x: 1180,
    y: 1295,
    scale: 0.55,
    collision: Footprint.BENCH,
    district: 'municipality',
  },
  {
    id: 'civic-planter-west',
    textureKey: TextureKeys.PLANTER,
    x: 815,
    y: 1390,
    scale: 0.55,
    collision: Footprint.PLANTER,
    district: 'municipality',
  },
  {
    id: 'civic-planter-east',
    textureKey: TextureKeys.PLANTER,
    x: 1105,
    y: 1390,
    scale: 0.55,
    collision: Footprint.PLANTER,
    district: 'municipality',
  },
  {
    id: 'civic-trash-west',
    textureKey: TextureKeys.TRASH_CAN,
    x: 775,
    y: 1305,
    scale: 0.55,
    collision: Footprint.TRASH,
    district: 'municipality',
  },
  {
    id: 'civic-trash-east',
    textureKey: TextureKeys.TRASH_CAN,
    x: 1145,
    y: 1305,
    scale: 0.55,
    collision: Footprint.TRASH,
    district: 'municipality',
  },
  {
    id: 'civic-sign',
    textureKey: TextureKeys.SIGN,
    x: 1090,
    y: 1215,
    scale: 0.5,
    collision: Footprint.SIGN,
    district: 'municipality',
  },

  // --- parked cars on the avenue's south shoulder, residential side ---
  {
    id: 'car-blue',
    textureKey: TextureKeys.CAR_BLUE,
    x: 1380,
    y: 845,
    scale: 0.55,
    collision: Footprint.CAR,
    district: 'residential',
  },
  {
    id: 'car-white',
    textureKey: TextureKeys.CAR_WHITE,
    x: 1690,
    y: 845,
    scale: 0.55,
    collision: Footprint.CAR,
    district: 'residential',
  },

  // --- residential dressing ---
  {
    id: 'housing-trash-shop',
    textureKey: TextureKeys.TRASH_CAN,
    x: 1330,
    y: 855,
    scale: 0.55,
    collision: Footprint.TRASH,
    district: 'residential',
  },
  ...row({
    idPrefix: 'housing-hedge-north',
    textureKey: TextureKeys.HEDGE_ROW,
    district: 'residential',
    y: 705,
    from: 1420,
    to: 1750,
    step: 110,
    scale: 0.7,
    collision: Footprint.HEDGE_ROW,
  }),
  ...row({
    idPrefix: 'housing-hedge-south',
    textureKey: TextureKeys.HEDGE_ROW,
    district: 'residential',
    y: 1165,
    from: 1420,
    to: 1750,
    step: 110,
    scale: 0.7,
    collision: Footprint.HEDGE_ROW,
  }),
] as const;

/** Everything the scene should instantiate as a depth-sorted world sprite. */
// ---------------------------------------------------------------------------
// DRESSING — fills the bare lawns so the town reads as lived-in (closer to
// the density of the Unity map). Only the smooth illustrated sprites.
// ---------------------------------------------------------------------------

const deco = (
  id: string,
  textureKey: TextureKey,
  x: number,
  y: number,
  scale: number,
  district: DistrictId,
  collision: CollisionBox | null = null,
): WorldObject => ({ id, textureKey, x, y, scale, district, collision });

export const DRESSING: readonly WorldObject[] = [
  // --- farmland: hay, bushes, tufts around the plots ---
  deco('farm-hay-1', TextureKeys.HAYSTACK_BIG, 590, 600, 0.7, 'agriculture', Footprint.HAYSTACK),
  deco('farm-hay-2', TextureKeys.HAYSTACK_BIG, 626, 640, 0.6, 'agriculture', Footprint.HAYSTACK),
  deco('farm-hay-3', TextureKeys.HAYSTACK_BIG, 200, 1040, 0.65, 'agriculture', Footprint.HAYSTACK),
  deco('farm-crate', TextureKeys.CRATE, 545, 1000, 0.6, 'agriculture', Footprint.CRATE),
  deco('farm-barrel', TextureKeys.BARREL_WOOD, 520, 1012, 0.65, 'agriculture', Footprint.BARREL),
  deco('farm-bush-1', TextureKeys.BUSH_SMALL, 470, 440, 0.6, 'agriculture'),
  deco('farm-bush-2', TextureKeys.BUSH, 620, 470, 0.6, 'agriculture', Footprint.BUSH),
  deco('farm-bush-3', TextureKeys.BUSH_SMALL, 240, 1130, 0.6, 'agriculture'),
  deco('farm-bush-4', TextureKeys.BUSH, 600, 1120, 0.55, 'agriculture', Footprint.BUSH),
  deco('farm-tuft-1', TextureKeys.GRASS_PATCH, 420, 470, 0.7, 'agriculture'),
  deco('farm-tuft-2', TextureKeys.GRASS_PATCH, 160, 560, 0.7, 'agriculture'),
  deco('farm-tuft-3', TextureKeys.GRASS_PATCH, 560, 900, 0.7, 'agriculture'),
  deco('farm-tuft-4', TextureKeys.GRASS_PATCH, 150, 960, 0.7, 'agriculture'),

  // --- residential lawn between the avenue and the southern houses ---
  deco('res-flowers-1', TextureKeys.FLOWER_BUSH, 1468, 930, 0.55, 'residential', Footprint.FLOWER_BUSH),
  deco('res-flowers-2', TextureKeys.FLOWER_BUSH, 1574, 930, 0.55, 'residential', Footprint.FLOWER_BUSH),
  deco('res-flowers-3', TextureKeys.FLOWER_BUSH, 1790, 930, 0.55, 'residential', Footprint.FLOWER_BUSH),
  deco('res-bench', TextureKeys.BENCH_2, 1620, 880, 0.6, 'residential', Footprint.BENCH_2),
  deco('res-tree-1', TextureKeys.TREE_ROUND, 1885, 905, 0.5, 'residential', Footprint.TREE),
  deco('res-bush-1', TextureKeys.BUSH_SMALL, 1440, 850, 0.6, 'residential'),
  deco('res-tuft-1', TextureKeys.GRASS_PATCH, 1600, 960, 0.7, 'residential'),
  deco('res-tuft-2', TextureKeys.GRASS_PATCH, 1300, 960, 0.7, 'residential'),

  // --- north lawn behind the northern houses ---
  deco('res-north-tree-1', TextureKeys.TREE_ROUND, 1330, 470, 0.5, 'residential', Footprint.TREE),
  deco('res-north-tree-2', TextureKeys.TREE_BLOSSOM, 1470, 455, 0.5, 'residential', Footprint.TREE),
  deco('res-north-tree-3', TextureKeys.TREE_ROUND_2, 1610, 470, 0.52, 'residential', Footprint.TREE),
  deco('res-north-tree-4', TextureKeys.TREE_ROUND, 1760, 455, 0.5, 'residential', Footprint.TREE),
  deco('res-north-bush-1', TextureKeys.BUSH, 1400, 500, 0.55, 'residential', Footprint.BUSH),
  deco('res-north-bush-2', TextureKeys.FLOWER_BUSH, 1690, 505, 0.5, 'residential', Footprint.FLOWER_BUSH),

  // --- lawns either side of the town hall ---
  deco('hall-tree-w1', TextureKeys.TREE_ROUND_2, 200, 1240, 0.52, 'municipality', Footprint.TREE),
  deco('hall-tree-w2', TextureKeys.TREE_BLOSSOM, 330, 1330, 0.5, 'municipality', Footprint.TREE),
  deco('hall-tree-w3', TextureKeys.TREE_ROUND, 120, 1390, 0.5, 'municipality', Footprint.TREE),
  deco('hall-flowers-w', TextureKeys.FLOWER_BUSH, 420, 1400, 0.5, 'municipality', Footprint.FLOWER_BUSH),
  deco('hall-tree-e1', TextureKeys.TREE_ROUND_2, 1400, 1250, 0.52, 'municipality', Footprint.TREE),
  deco('hall-tree-e2', TextureKeys.TREE_BLOSSOM, 1560, 1330, 0.5, 'municipality', Footprint.TREE),
  deco('hall-tree-e3', TextureKeys.TREE_ROUND, 1730, 1250, 0.5, 'municipality', Footprint.TREE),
  deco('hall-tree-e4', TextureKeys.TREE_ROUND_2, 1860, 1380, 0.52, 'municipality', Footprint.TREE),
  deco('hall-flowers-e', TextureKeys.FLOWER_BUSH, 1480, 1400, 0.5, 'municipality', Footprint.FLOWER_BUSH),
  deco('hall-bench-e', TextureKeys.BENCH, 1650, 1300, 0.5, 'municipality', Footprint.BENCH),
];

/**
 * Objects that sat where the ring roads, side streets, playground and
 * gazebo now are (Unity-map relayout). Filtered out here rather than
 * deleted from the generators so the grids/rows stay readable.
 */
const CLEARED_FOR_LAYOUT = new Set([
  'apartment-north', 'house-south-3',
  'park-tree-ne-0', 'park-tree-ne-1', 'park-tree-ne-2', 'grass-patch-1',
  'housing-tree-1', 'housing-tree-3',
  'farm-pine-6', 'farm-pine-7', 'farm-pine-8', 'farm-pine-9', 'farm-pine-10', 'farm-pine-11',
  'res-tree-1', 'res-north-tree-1', 'res-north-tree-2', 'res-north-tree-3', 'res-north-tree-4',
  'res-north-bush-1', 'res-north-bush-2',
  'hall-tree-w1', 'hall-tree-w2', 'hall-tree-w3', 'hall-flowers-w',
  'hall-tree-e1', 'hall-tree-e3', 'hall-tree-e4',
  'civic-hedge-east-1', 'civic-hedge-west-0',
  'civic-tree-0', 'civic-tree-1', 'civic-tree-4', 'civic-tree-5',
  'res-flowers-3',
]);

const SHORE_TREE_KINDS: readonly TextureKey[] = [
  TextureKeys.TREE_ROUND, TextureKeys.TREE_PINE, TextureKeys.TREE_ROUND_2, TextureKeys.TREE_PINE, TextureKeys.TREE_ROUND,
];

/** The reservoir: dam sprite + real trees/rocks/bushes around the lake. */
const LAKESIDE: readonly WorldObject[] = [
  {
    id: 'dam-front',
    textureKey: TextureKeys.DAM_FRONT,
    x: DAM.x + DAM.width / 2,
    y: DAM.y + DAM.height,
    scale: DAM.width / 1000,
    collision: null,
    district: 'reservoir',
  },
  ...SHORE_TREE_SPOTS.map(([x, y], i) =>
    deco(`shore-tree-${i}`, SHORE_TREE_KINDS[i % SHORE_TREE_KINDS.length], x, y, 0.46 + (i % 3) * 0.04, 'reservoir', Footprint.TREE),
  ),
  deco('shore-rocks-w1', TextureKeys.ROCKS, 140, 120, 0.55, 'reservoir', Footprint.ROCKS),
  deco('shore-rocks-w2', TextureKeys.ROCKS, 420, 170, 0.5, 'reservoir', Footprint.ROCKS),
  deco('shore-rocks-e1', TextureKeys.ROCKS, 1500, 140, 0.55, 'reservoir', Footprint.ROCKS),
  deco('shore-rocks-e2', TextureKeys.ROCKS, 1760, 30, 0.5, 'reservoir', Footprint.ROCKS),
  deco('shore-bush-1', TextureKeys.BUSH, 560, 330, 0.55, 'reservoir', Footprint.BUSH),
  deco('shore-bush-2', TextureKeys.FLOWER_BUSH, 1400, 330, 0.5, 'reservoir', Footprint.FLOWER_BUSH),
  deco('shore-bush-3', TextureKeys.BUSH_SMALL, 1250, 300, 0.6, 'reservoir'),
];

/** Southwest leisure corner (Unity map): playground + gazebo among trees. */
const LEISURE: readonly WorldObject[] = [
  deco('playground', TextureKeys.PLAYGROUND, 300, 1432, 0.4, 'municipality', { width: 210, height: 100, offsetY: -60 }),
  deco('gazebo', TextureKeys.GAZEBO, 535, 1436, 0.32, 'municipality', { width: 110, height: 36 }),
  deco('leisure-bench-1', TextureKeys.BENCH, 440, 1330, 0.45, 'municipality', Footprint.BENCH),
  deco('leisure-tree-1', TextureKeys.TREE_ROUND_2, 150, 1330, 0.5, 'municipality', Footprint.TREE),
  deco('leisure-tree-2', TextureKeys.TREE_BLOSSOM, 625, 1335, 0.5, 'municipality', Footprint.TREE),
  deco('leisure-flowers', TextureKeys.FLOWER_BUSH, 450, 1430, 0.45, 'municipality', Footprint.FLOWER_BUSH),
];

/** Street furniture + trees along the new roads. */
const ROADSIDE: readonly WorldObject[] = [
  deco('ring-w-lamp-1', TextureKeys.STREET_LAMP, 145, 930, 0.5, 'agriculture', Footprint.LAMP),
  deco('ring-w-lamp-2', TextureKeys.STREET_LAMP, 145, 1120, 0.5, 'agriculture', Footprint.LAMP),
  deco('ring-e-lamp-1', TextureKeys.STREET_LAMP, 1815, 600, 0.5, 'residential', Footprint.LAMP),
  deco('ring-e-lamp-2', TextureKeys.STREET_LAMP, 1815, 1000, 0.5, 'residential', Footprint.LAMP),
  deco('north-st-lamp-1', TextureKeys.STREET_LAMP, 1400, 520, 0.5, 'residential', Footprint.LAMP),
  deco('north-st-lamp-2', TextureKeys.STREET_LAMP, 1660, 520, 0.5, 'residential', Footprint.LAMP),
  deco('south-e-lamp-1', TextureKeys.STREET_LAMP, 1460, 1300, 0.5, 'municipality', Footprint.LAMP),
  deco('south-e-lamp-2', TextureKeys.STREET_LAMP, 1700, 1300, 0.5, 'municipality', Footprint.LAMP),
  deco('south-e-tree-1', TextureKeys.TREE_ROUND, 1620, 1420, 0.5, 'municipality', Footprint.TREE),
  deco('south-e-tree-2', TextureKeys.TREE_BLOSSOM, 1760, 1400, 0.5, 'municipality', Footprint.TREE),
  deco('south-w-pine-1', TextureKeys.TREE_PINE, 20, 1000, 0.5, 'agriculture'),
];

export const WORLD_OBJECTS: readonly WorldObject[] = [
  ...BUILDINGS,
  ...WATERWORKS,
  ...NATURE,
  ...AGRICULTURE,
  ...PROPS,
  ...DRESSING,
  ...ROADSIDE,
  ...LAKESIDE,
  ...LEISURE,
].filter((o) => !CLEARED_FOR_LAYOUT.has(o.id));
