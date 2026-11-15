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
import { ROAD_WIDTH, WORLD, WORLD_TOP, sc, TOWN_SCALE, type DistrictId } from './districts';
import { SPRINKLERS } from './fieldTasks';

/** Park centre in the original (unscaled) layout space the data below is authored in. */
const PARK_CENTER = { x: 960, y: 760 } as const;

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
  /** Depth line override (default: the base line `y`). */
  sortY?: number;
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
const LEGACY_DAM = { x: 560, y: 100, width: 800, height: 380 } as const;


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

const LEGACY_GROUND_LAYERS: readonly GroundLayer[] = [
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
const LEGACY_COLLISION_ZONES: readonly CollisionZone[] = [
  // Open lake water — beaches stay walkable.
  ...LAKE_WATER_RECTS.map(([x, y, width, height]) => ({ id: `lake-${x}-${y}`, x, y, width, height })),
  // Dam wall (left wing, gates, right wing) and the spillway basin.
  { id: 'dam-wall', x: LEGACY_DAM.x + 10, y: LEGACY_DAM.y + 40, width: LEGACY_DAM.width - 20, height: 200 },
  { id: 'dam-basin', x: LEGACY_DAM.x + 270, y: LEGACY_DAM.y + 240, width: 300, height: 110 },
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
  // make room for the second wheat / vegetable plots of the grown farm
  'farm-hay-1', 'farm-hay-2', 'farm-crate', 'farm-barrel', 'farm-bush-4',
  // the corner shop takes the first plot on the north street
  'house-north-0',
]);

const SHORE_TREE_KINDS: readonly TextureKey[] = [
  TextureKeys.TREE_ROUND, TextureKeys.TREE_PINE, TextureKeys.TREE_ROUND_2, TextureKeys.TREE_PINE, TextureKeys.TREE_ROUND,
];

/** The reservoir: dam sprite + real trees/rocks/bushes around the lake. */
const LAKESIDE: readonly WorldObject[] = [
  {
    id: 'dam-front',
    textureKey: TextureKeys.DAM_FRONT,
    x: LEGACY_DAM.x + LEGACY_DAM.width / 2,
    y: LEGACY_DAM.y + LEGACY_DAM.height,
    scale: LEGACY_DAM.width / 1000,
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

const LEGACY_OBJECTS: readonly WorldObject[] = [
  ...BUILDINGS,
  ...WATERWORKS,
  ...NATURE,
  ...AGRICULTURE,
  ...PROPS,
  ...DRESSING,
  ...LAKESIDE,
].filter((o) => !CLEARED_FOR_LAYOUT.has(o.id) && o.id !== 'park-fountain' && o.id !== 'civic-sign');

// Superseded by the grown layout below (kept for reference, not placed).
void ROADSIDE;
void LEISURE;

// ===========================================================================
// GROWN TOWN (×TOWN_SCALE) — Unity-map structure: boulevard with a planted
// median, a central square with the fountain, ring roads, sidewalks along
// every road, municipality square on a through road.
// ===========================================================================

type Rect = { x: number; y: number; width: number; height: number };

const R = ROAD_WIDTH;
const SIDEWALK = 22;

/** Boulevard: two carriageways around a planted median, x centre 1200. */
const MEDIAN = { x: 1135, width: 130 };
const BLVD_W = { x: MEDIAN.x - R, width: R };
const BLVD_E = { x: MEDIAN.x + MEDIAN.width, width: R };

/**
 * Town centre: a roundabout (user's pick from three proposals). The avenue
 * and both boulevard carriageways join the ring; the fountain stands on the
 * planted island. Drawn by GameScene.drawRoundabout.
 */
export const ROUNDABOUT = { x: 1200, y: 950, r: 205, island: 112 } as const;
export const FOUNTAIN = { x: 1200, y: 990, scale: 0.62 } as const;
const RB_BOX: Rect = { x: ROUNDABOUT.x - ROUNDABOUT.r - 25, y: ROUNDABOUT.y - ROUNDABOUT.r - 25, width: 2 * ROUNDABOUT.r + 50, height: 2 * ROUNDABOUT.r + 50 };

const AVENUE_Y = 950 - R / 2;
const NORTH_ST_Y = 600;
const SOUTH_RD_Y = 1480;
const RING_W_X = 50;
const RING_E_X = 2262;

/** Municipality square south of the through road. */
export const CIVIC_PLAZA: Rect = { x: 900, y: 1630, width: 600, height: 170 };

/** The dam sprite in world space (scaled with the lake). */
export const DAM = {
  x: sc(LEGACY_DAM.x),
  y: sc(LEGACY_DAM.y),
  width: sc(LEGACY_DAM.width),
  height: sc(LEGACY_DAM.height),
} as const;
/** Depth line of the dam: the foot of the wall, so actors in front of it draw over it. */
export const DAM_SORT_Y = DAM.y + Math.round(DAM.height * 0.62);

const BASIN_BOTTOM = DAM.y + Math.round(DAM.height * 0.97);

const H_ROADS: Rect[] = [
  { x: RING_W_X, y: AVENUE_Y, width: ROUNDABOUT.x - ROUNDABOUT.r + 20 - RING_W_X, height: R },
  { x: ROUNDABOUT.x + ROUNDABOUT.r - 20, y: AVENUE_Y, width: RING_E_X + R - (ROUNDABOUT.x + ROUNDABOUT.r - 20), height: R },
  { x: BLVD_E.x, y: NORTH_ST_Y, width: RING_E_X + R - BLVD_E.x, height: R },
  { x: RING_W_X, y: SOUTH_RD_Y, width: RING_E_X + R - RING_W_X, height: R },
];
/** The boulevard runs into the ring a little (the ring is drawn over it). */
const CUT = { top: ROUNDABOUT.y - ROUNDABOUT.r + 50, bottom: ROUNDABOUT.y + ROUNDABOUT.r - 50 };
const V_ROADS: Rect[] = [
  { x: BLVD_W.x, y: BASIN_BOTTOM, width: R, height: CUT.top - BASIN_BOTTOM },
  { x: BLVD_E.x, y: BASIN_BOTTOM, width: R, height: CUT.top - BASIN_BOTTOM },
  { x: BLVD_W.x, y: CUT.bottom, width: R, height: SOUTH_RD_Y - CUT.bottom },
  { x: BLVD_E.x, y: CUT.bottom, width: R, height: SOUTH_RD_Y - CUT.bottom },
  { x: RING_W_X, y: AVENUE_Y, width: R, height: SOUTH_RD_Y + R - AVENUE_Y },
  { x: RING_E_X, y: NORTH_ST_Y, width: R, height: SOUTH_RD_Y + R - NORTH_ST_Y },
];
const MEDIAN_STRIPS: Rect[] = [
  { x: MEDIAN.x, y: BASIN_BOTTOM, width: MEDIAN.width, height: CUT.top - BASIN_BOTTOM },
  { x: MEDIAN.x, y: CUT.bottom, width: MEDIAN.width, height: SOUTH_RD_Y - CUT.bottom },
];

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Sidewalk strips both sides of every road (roads draw over them at joints). */
const SIDEWALKS: (Rect & { horizontal: boolean })[] = [
  ...H_ROADS.flatMap((r) => [
    { x: r.x, y: r.y - SIDEWALK, width: r.width, height: SIDEWALK, horizontal: true },
    { x: r.x, y: r.y + r.height, width: r.width, height: SIDEWALK, horizontal: true },
  ]),
  ...V_ROADS.flatMap((r) => [
    { x: r.x - SIDEWALK, y: r.y, width: SIDEWALK, height: r.height, horizontal: false },
    { x: r.x + r.width, y: r.y, width: SIDEWALK, height: r.height, horizontal: false },
  ]),
].filter((w) => !MEDIAN_STRIPS.some((m) => overlap(w, m)));

const JUNCTIONS: Rect[] = V_ROADS.flatMap((v) =>
  H_ROADS.filter((h) => overlap(v, h)).map((h) => ({
    x: Math.max(v.x, h.x),
    y: Math.max(v.y, h.y),
    width: Math.min(v.x + v.width, h.x + h.width) - Math.max(v.x, h.x),
    height: Math.min(v.y + v.height, h.y + h.height) - Math.max(v.y, h.y),
  })),
);

/** Sidewalk squares at every junction corner so walks turn the corner. */
const CORNERS: Rect[] = JUNCTIONS.flatMap((j) => [
  { x: j.x - SIDEWALK, y: j.y - SIDEWALK, width: SIDEWALK, height: SIDEWALK },
  { x: j.x + j.width, y: j.y - SIDEWALK, width: SIDEWALK, height: SIDEWALK },
  { x: j.x - SIDEWALK, y: j.y + j.height, width: SIDEWALK, height: SIDEWALK },
  { x: j.x + j.width, y: j.y + j.height, width: SIDEWALK, height: SIDEWALK },
]);

const ZEBRA = 36;
/** Zebra crossings on every arm of every junction (and the roundabout). */
const ZEBRAS: (Rect & { across: 'h' | 'v' })[] = [
  ...V_ROADS.flatMap((v) =>
    H_ROADS.filter((h) => overlap(v, h)).flatMap((h) => {
      const jx = Math.max(v.x, h.x);
      const jw = Math.min(v.x + v.width, h.x + h.width) - jx;
      const jy = Math.max(v.y, h.y);
      const jh = Math.min(v.y + v.height, h.y + h.height) - jy;
      const out: (Rect & { across: 'h' | 'v' })[] = [];
      if (h.x < jx - 80) out.push({ x: jx - SIDEWALK - ZEBRA - 4, y: h.y, width: ZEBRA, height: R, across: 'h' });
      if (h.x + h.width > jx + jw + 80) out.push({ x: jx + jw + SIDEWALK + 4, y: h.y, width: ZEBRA, height: R, across: 'h' });
      if (v.y < jy - 80) out.push({ x: v.x, y: jy - SIDEWALK - ZEBRA - 4, width: R, height: ZEBRA, across: 'v' });
      if (v.y + v.height > jy + jh + 80) out.push({ x: v.x, y: jy + jh + SIDEWALK + 4, width: R, height: ZEBRA, across: 'v' });
      return out;
    }),
  ),
  // roundabout arms (clear of Kemal's sprinkler puddles)
  { x: 845, y: AVENUE_Y, width: ZEBRA, height: R, across: 'h' },
  { x: 1520, y: AVENUE_Y, width: ZEBRA, height: R, across: 'h' },
  { x: BLVD_W.x, y: 650, width: R, height: ZEBRA, across: 'v' },
  { x: BLVD_E.x, y: 650, width: R, height: ZEBRA, across: 'v' },
  { x: BLVD_W.x, y: 1250, width: R, height: ZEBRA, across: 'v' },
  { x: BLVD_E.x, y: 1250, width: R, height: ZEBRA, across: 'v' },
];

/** Paved, landscaped plaza around the spillway pool below the dam. */
export const DAM_PLAZA: Rect = { x: 930, y: DAM_SORT_Y + 4, width: 540, height: BASIN_BOTTOM + 34 - (DAM_SORT_Y + 4) };

/** Walled enclosures: town-hall grounds and the playground. */
const CIVIC_YARD = { x: 760, y: 1625, x2: 1640, gate: 1200 };
const PLAY_YARD = { x: 140, y: 1625, x2: 760, gate: 440 };
const GATE_GAP = 70;
const WALL_H = 26;

interface WallRun { id: string; x: number; y: number; length: number; dir: 'h' | 'v' }
const yardWalls = (id: string, yd: { x: number; y: number; x2: number; gate: number }): WallRun[] => [
  { id: `${id}-n1`, x: yd.x, y: yd.y, length: yd.gate - GATE_GAP / 2 - yd.x, dir: 'h' },
  { id: `${id}-n2`, x: yd.gate + GATE_GAP / 2, y: yd.y, length: yd.x2 - (yd.gate + GATE_GAP / 2), dir: 'h' },
  { id: `${id}-w`, x: yd.x, y: yd.y, length: 1800 - yd.y, dir: 'v' },
  { id: `${id}-e`, x: yd.x2, y: yd.y, length: 1800 - yd.y, dir: 'v' },
];
/** Straight wall runs; GameScene draws them as tiled stone + pillars. */
export const WALL_RUNS: readonly WallRun[] = [
  ...yardWalls('civic', CIVIC_YARD),
  // the playground shares its east wall with the town-hall grounds
  ...yardWalls('play', PLAY_YARD).filter((w) => w.id !== 'play-e'),
];
export const WALL_THICKNESS = WALL_H;
export const GATES: readonly { x: number; y: number }[] = [
  { x: CIVIC_YARD.gate, y: CIVIC_YARD.y + 6 },
  { x: PLAY_YARD.gate, y: PLAY_YARD.y + 6 },
];

const ROAD_SCALE_Y = R / 127;
const legacyGround = (id: string) => LEGACY_GROUND_LAYERS.find((l) => l.id === id)!;
const scaledPath = (id: string): GroundLayer => {
  const l = legacyGround(id);
  return { ...l, x: sc(l.x), y: sc(l.y), height: sc(l.height) };
};

export const GROUND_LAYERS: readonly GroundLayer[] = [
  { id: 'ground-base', textureKey: TextureKeys.GROUND_GRASS, x: 0, y: WORLD_TOP, width: WORLD.width, height: WORLD.height - WORLD_TOP, depth: GroundDepth.BASE, tileScale: 0.5 },
  { id: 'ground-agriculture', textureKey: TextureKeys.GROUND_GRASS_DRY, x: 0, y: 450, width: 825, height: 1000, depth: GroundDepth.DISTRICT_TINT, tileScale: 0.5, feather: 80 },
  { id: 'ground-park', textureKey: TextureKeys.GROUND_GRASS_LUSH, x: 825, y: 450, width: 750, height: 1000, depth: GroundDepth.DISTRICT_TINT, tileScale: 0.5, feather: 50 },
  scaledPath('path-farmhouse'),
  scaledPath('path-veg'),
  ...SIDEWALKS.map((w, i) => ({
    id: `sidewalk-${i}`,
    textureKey: w.horizontal ? TextureKeys.SIDEWALK_H : TextureKeys.SIDEWALK_V,
    x: w.x, y: w.y, width: w.width, height: w.height,
    depth: GroundDepth.ROAD - 4,
    tileScale: SIDEWALK / 44,
  })),
  ...MEDIAN_STRIPS.map((m, i) => ({
    id: `median-${i}`, textureKey: TextureKeys.GROUND_PATH, ...m, depth: GroundDepth.ROAD - 4, tileScale: 0.15,
  })),
  ...V_ROADS.map((r, i) => ({
    id: `road-v-${i}`, textureKey: TextureKeys.ROAD_DASH, ...r, depth: GroundDepth.ROAD - 2, scaleY: ROAD_SCALE_Y, vertical: true,
  })),
  ...H_ROADS.map((r, i) => ({
    id: `road-h-${i}`, textureKey: TextureKeys.ROAD_DASH, ...r, depth: GroundDepth.ROAD, scaleY: ROAD_SCALE_Y,
  })),
  ...JUNCTIONS.map((j, i) => ({
    id: `junction-${i}`, textureKey: TextureKeys.ROAD_JUNCTION, ...j, depth: GroundDepth.ROAD + 1, tileScale: 0.6,
  })),
  ...CORNERS.map((c, i) => ({
    id: `corner-${i}`, textureKey: TextureKeys.SIDEWALK_H, ...c, depth: GroundDepth.ROAD - 4, tileScale: SIDEWALK / 44,
  })),
  ...ZEBRAS.map((z, i) => ({
    id: `zebra-${i}`, textureKey: z.across === 'h' ? TextureKeys.ZEBRA_V : TextureKeys.ZEBRA_H,
    x: z.x, y: z.y, width: z.width, height: z.height, depth: GroundDepth.ROAD + 2,
    tileScale: z.across === 'h' ? R / 88 : R / 88,
  })),
  // Spillway plaza: the pool sits in a paved, planted square the boulevard opens onto.
  { id: 'dam-plaza', textureKey: TextureKeys.GROUND_PATH, ...DAM_PLAZA, depth: GroundDepth.ROAD + 2, tileScale: 0.15, feather: 12 },
  // Lawns inside the walled yards.
  { id: 'civic-lawn', textureKey: TextureKeys.GROUND_GRASS_LUSH, x: CIVIC_YARD.x, y: CIVIC_YARD.y, width: CIVIC_YARD.x2 - CIVIC_YARD.x, height: 200, depth: GroundDepth.ROAD + 1, tileScale: 0.5 },
  { id: 'play-sand', textureKey: TextureKeys.GROUND_GRASS_LUSH, x: PLAY_YARD.x, y: PLAY_YARD.y, width: PLAY_YARD.x2 - PLAY_YARD.x, height: 200, depth: GroundDepth.ROAD + 1, tileScale: 0.5 },
  { id: 'civic-plaza', textureKey: TextureKeys.GROUND_PATH, ...CIVIC_PLAZA, depth: GroundDepth.ROAD + 2, tileScale: 0.15, feather: 8 },
];

/** Everything players must not walk through. */
/** Second wheat + vegetable plots (Unity map has two of each). */
const EXTRA_FIELDS = [
  { id: 'field-wheat-2', key: TextureKeys.FIELD_WHEAT, x: 735, y: 867, fence: { dx: -94, dy: -187, w: 188, h: 187 } },
  { id: 'field-veg-2', key: TextureKeys.FIELD_VEG, x: 700, y: 1379, fence: { dx: -83, dy: -186, w: 165, h: 186 } },
] as const;

export const COLLISION_ZONES: readonly CollisionZone[] = [
  ...WALL_RUNS.map((w) =>
    w.dir === 'h'
      ? { id: `wall-${w.id}`, x: w.x, y: w.y - 14, width: w.length, height: 16 }
      : { id: `wall-${w.id}`, x: w.x - 8, y: w.y, width: 16, height: w.length },
  ),
  ...EXTRA_FIELDS.map((f) => ({ id: `${f.id}-fence`, x: f.x + f.fence.dx, y: f.y + f.fence.dy, width: f.fence.w, height: f.fence.h })),
  ...LEGACY_COLLISION_ZONES.map((z) =>
  z.id.startsWith('field-')
    ? // fenced plots keep their sprite size: move the box, keep its size
      { ...z, x: Math.round((z.x + z.width / 2) * TOWN_SCALE - z.width / 2), y: Math.round((z.y + z.height / 2) * TOWN_SCALE - z.height / 2) }
    : { ...z, x: sc(z.x), y: sc(z.y), width: sc(z.width), height: sc(z.height) },
  ),
];

/** Areas kept clear of old scenery after scaling (roads, walks, squares). */
const KEEP_CLEAR: Rect[] = [
  ...H_ROADS, ...V_ROADS, ...SIDEWALKS, ...MEDIAN_STRIPS, RB_BOX, CIVIC_PLAZA, DAM_PLAZA,
  { x: CIVIC_YARD.x - 20, y: CIVIC_YARD.y - 30, width: CIVIC_YARD.x2 - CIVIC_YARD.x + 40, height: 230 },
  { x: PLAY_YARD.x - 20, y: PLAY_YARD.y - 30, width: 40, height: 230 },
  { x: PLAY_YARD.gate - 50, y: PLAY_YARD.y - 30, width: 100, height: 40 },
];
const blocks = (o: WorldObject) =>
  KEEP_CLEAR.some((r) => o.x > r.x - 14 && o.x < r.x + r.width + 14 && o.y > r.y - 6 && o.y < r.y + r.height + 46);

const MOVED: Record<string, { x: number; y: number }> = {
  windmill: { x: 215, y: 1270 },
};

const scaled: WorldObject[] = LEGACY_OBJECTS.map((o) => {
  const moved = MOVED[o.id];
  const isDam = o.id === 'dam-front';
  return {
    ...o,
    x: moved?.x ?? sc(o.x),
    y: moved?.y ?? sc(o.y),
    scale: isDam ? (o.scale ?? 1) * TOWN_SCALE : o.scale,
    sortY: isDam ? DAM_SORT_Y : o.sortY,
  };
}).filter(
  (o) =>
    o.id === 'municipality' ||
    o.id === 'dam-front' ||
    (!blocks(o) && !SPRINKLERS.some((k) => Math.abs(o.x - k.x) < 55 && Math.abs(o.y - k.y) < 45)),
);

const L = (prefix: string, key: TextureKey, pts: [number, number][], scale: number, district: DistrictId, collision: CollisionBox | null = null) =>
  pts.map(([x, y], i) => deco(`${prefix}-${i}`, key, x, y, scale, district, collision));

/** New dressing for the grown layout. */
const TOWN_DRESSING: readonly WorldObject[] = [
  // --- roundabout: fountain on the island, flowers, lamps/benches/trees at the corners ---
  { id: 'park-fountain', textureKey: TextureKeys.FOUNTAIN, x: FOUNTAIN.x, y: FOUNTAIN.y, scale: FOUNTAIN.scale, collision: { width: 90, height: 28 }, district: 'park' },
  ...L('rb-flowers', TextureKeys.FLOWER_BUSH, [[1125, 930], [1275, 930], [1130, 1045], [1270, 1045]], 0.4, 'park', Footprint.FLOWER_BUSH),
  ...L('rb-lamp', TextureKeys.STREET_LAMP, [[985, 770], [1415, 770], [985, 1150], [1415, 1150]], 0.5, 'park', Footprint.LAMP),
  ...L('rb-bench', TextureKeys.BENCH, [[940, 790], [1460, 790], [940, 1125], [1460, 1125]], 0.45, 'park', Footprint.BENCH),
  ...L('rb-tree', TextureKeys.TREE_BLOSSOM, [[905, 755], [1495, 755], [905, 1200], [1495, 1200]], 0.45, 'park', Footprint.TREE),
  deco('notice-board', TextureKeys.SIGN, 1440, 1185, 0.5, 'park', Footprint.SIGN),
  // --- boulevard median: trees, benches, lamps ---
  ...L('median-tree', TextureKeys.TREE_ROUND_2, [[1200, 650], [1200, 760], [1200, 1210], [1200, 1330], [1200, 1450]], 0.44, 'park', Footprint.TREE),
  ...L('median-bench', TextureKeys.BENCH_2, [[1200, 700], [1200, 1270], [1200, 1390]], 0.5, 'park', Footprint.BENCH_2),
  ...L('blvd-lamp', TextureKeys.STREET_LAMP, [[1012, 680], [1388, 680], [1012, 1260], [1388, 1260], [1012, 1420], [1388, 1420]], 0.5, 'park', Footprint.LAMP),
  // --- road lamps ---
  ...L('ring-lamp', TextureKeys.STREET_LAMP, [[168, 1150], [168, 1360], [2240, 800], [2240, 1150], [2240, 1400]], 0.5, 'residential', Footprint.LAMP),
  ...L('street-lamp', TextureKeys.STREET_LAMP, [[1650, 712], [2000, 712], [300, 1588], [1900, 1592], [600, 885], [1800, 885]], 0.5, 'residential', Footprint.LAMP),
  // --- spillway plaza: benches, lamps, flower beds, hedges along the dam foot ---
  ...L('dp-bench', TextureKeys.BENCH, [[975, 560], [1425, 560]], 0.45, 'reservoir', Footprint.BENCH),
  ...L('dp-lamp', TextureKeys.STREET_LAMP, [[950, 470], [1450, 470], [960, 620], [1440, 620]], 0.5, 'reservoir', Footprint.LAMP),
  ...L('dp-flowers', TextureKeys.FLOWER_BUSH, [[1010, 610], [1390, 610], [1000, 500], [1400, 500]], 0.42, 'reservoir', Footprint.FLOWER_BUSH),
  ...L('dp-hedge', TextureKeys.HEDGE_ROW, [[800, 440], [880, 440]], 0.6, 'reservoir', Footprint.HEDGE_ROW),
  ...L('dp-tree', TextureKeys.TREE_ROUND_2, [[905, 540], [1495, 540]], 0.48, 'reservoir', Footprint.TREE),
  // --- walled town-hall grounds ---
  ...L('civic-bench', TextureKeys.BENCH, [[860, 1690], [1540, 1690]], 0.5, 'municipality', Footprint.BENCH),
  ...L('civic-planter', TextureKeys.PLANTER, [[1120, 1650], [1280, 1650]], 0.5, 'municipality', Footprint.PLANTER),
  ...L('civic-flowers', TextureKeys.FLOWER_BUSH, [[820, 1640], [1580, 1640], [820, 1790], [1580, 1790]], 0.45, 'municipality', Footprint.FLOWER_BUSH),
  ...L('civic-tree', TextureKeys.TREE_ROUND_2, [[830, 1740], [1570, 1740]], 0.48, 'municipality', Footprint.TREE),
  ...L('civic-trash', TextureKeys.TRASH_CAN, [[905, 1695], [1495, 1695]], 0.5, 'municipality', Footprint.TRASH),
  // --- north quarter: houses on the north street ---
  ...L('house-n2', TextureKeys.HOUSE_RED, [[1720, 560], [1920, 560], [2120, 560]], 0.55, 'residential', Footprint.HOUSE),
  deco('apartment-n2', TextureKeys.APARTMENT, 2300, 560, 0.5, 'residential', Footprint.APARTMENT),
  ...L('n2-tree', TextureKeys.TREE_ROUND, [[1620, 520], [1820, 470], [2020, 470], [2210, 470]], 0.48, 'residential', Footprint.TREE),
  // --- grown farm ---
  ...EXTRA_FIELDS.map((f) => ({ id: f.id, textureKey: f.key, x: f.x, y: f.y, scale: 0.95, depthMode: 'ground' as const, depth: GroundDepth.DECAL, collision: null, district: 'agriculture' as const })),
  ...L('farm-hay', TextureKeys.HAYSTACK_BIG, [[230, 1100], [290, 1130], [560, 1100]], 0.62, 'agriculture', Footprint.HAYSTACK),
  // --- corner shop back on the avenue, residential side ---
  deco('shop-corner-2', TextureKeys.SHOP, 1700, 860, 0.58, 'residential', Footprint.SHOP),
  // --- southwest leisure corner ---
  deco('playground', TextureKeys.PLAYGROUND, 360, 1770, 0.45, 'municipality', { width: 230, height: 110, offsetY: -60 }),
  deco('gazebo', TextureKeys.GAZEBO, 640, 1775, 0.34, 'municipality', { width: 120, height: 40 }),
  ...L('leisure-tree', TextureKeys.TREE_ROUND, [[185, 1660], [560, 1640], [705, 1660]], 0.5, 'municipality', Footprint.TREE),
  deco('leisure-bench', TextureKeys.BENCH, 520, 1700, 0.45, 'municipality', Footprint.BENCH),
  ...L('leisure-flowers', TextureKeys.FLOWER_BUSH, [[180, 1790], [700, 1790]], 0.42, 'municipality', Footprint.FLOWER_BUSH),
  // --- southeast: a third row of houses on the through road ---
  ...L('house-se', TextureKeys.HOUSE_RED, [[1790, 1760], [1990, 1760], [2190, 1760]], 0.55, 'residential', Footprint.HOUSE),
  ...L('se-tree', TextureKeys.TREE_ROUND_2, [[1700, 1700], [2330, 1700]], 0.5, 'residential', Footprint.TREE),
];

export const WORLD_OBJECTS: readonly WorldObject[] = [...scaled, ...TOWN_DRESSING];
