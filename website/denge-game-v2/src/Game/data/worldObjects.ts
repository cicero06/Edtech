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

/**
 * Lowest opaque row of the panorama per 64 px column (derived from its alpha
 * channel) — everything above is lake, shore trees or dam, so not walkable.
 */
const RESERVOIR_EDGE: readonly (readonly [number, number])[] = [
  [0, 286], [64, 286], [128, 286], [192, 286], [256, 286], [320, 286],
  [384, 202], [448, 197], [512, 272], [576, 334], [640, 355], [704, 374],
  [768, 381], [832, 389], [896, 389], [960, 389], [1024, 389], [1088, 376],
  [1152, 354], [1216, 304], [1280, 293], [1344, 283], [1408, 274], [1472, 267],
  [1536, 267], [1600, 267], [1664, 267], [1728, 267], [1792, 267], [1856, 267],
];

/**
 * The north-south street is drawn with `road-straight` (194px tile: ~75px of
 * asphalt on the west + ~119px of pavement promenade on the east, park side).
 * The asphalt centre sits ~50px right of the tile's left edge, i.e. ~x963.
 */
const STREET_X = 913;
const STREET_WIDTH = 194;
/** Starts at the spillway basin's lower edge in the lake panorama. */
const STREET_TOP = 380;
const STREET_BOTTOM = 1290;

/** East-west asphalt avenue, drawn with the dashed-centre road tile. */
const AVENUE = { x: 180, y: PARK_CENTER.y - ROAD_WIDTH / 2, width: 1560, height: ROAD_WIDTH };

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
  // East-west avenue: farmland -> park -> housing (dashed asphalt).
  {
    id: 'road-horizontal',
    textureKey: TextureKeys.ROAD_DASH,
    ...AVENUE,
    depth: GroundDepth.ROAD,
    scaleY: AVENUE.height / 127,
  },
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
  // Lake, beaches, dam and spillway basin (see RESERVOIR_EDGE).
  ...RESERVOIR_EDGE.map(([x, bottom]) => ({
    id: `reservoir-edge-${x}`,
    x,
    y: WORLD_TOP,
    width: 64,
    height: bottom - WORLD_TOP,
  })),
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
    x: 130,
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
    x: 1720,
    y: 870,
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
export const WORLD_OBJECTS: readonly WorldObject[] = [
  ...BUILDINGS,
  ...WATERWORKS,
  ...NATURE,
  ...AGRICULTURE,
  ...PROPS,
] as const;
