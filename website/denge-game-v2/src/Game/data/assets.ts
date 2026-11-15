/**
 * Every texture the game loads, in one place.
 *
 * All world art is an **individual PNG** loaded with `load.image()`. There is no
 * tilemap, no tileset and no texture atlas in the runtime path any more. The
 * environment PNGs were sliced out of `public/assets/reference/town-atlas.png`
 * by `tools/slice-assets.mjs`.
 *
 * Native sizes are recorded here because the world layout in `worldObjects.ts`
 * depends on them and they are easy to get wrong from memory.
 */

export const TextureKeys = {
  // ground (tiled with TileSprite, so these must stay seamless)
  GROUND_GRASS: 'ground-grass',
  GROUND_GRASS_DRY: 'ground-grass-dry',
  GROUND_GRASS_LUSH: 'ground-grass-lush',
  GROUND_PATH: 'ground-path',
  GROUND_DIRT: 'ground-dirt',
  WATER: 'water',
  WATER_DEEP: 'water-deep',
  ROAD_STRAIGHT: 'road-straight',
  ROAD_DASH: 'road-dash',
  ROAD_JUNCTION: 'road-junction',

  // buildings
  TOWN_HALL: 'town-hall',
  HOUSE: 'house',
  WALL_PANEL: 'wall-panel',
  MUNICIPALITY: 'municipality',
  HOUSE_RED: 'house-red',
  FARMHOUSE: 'farmhouse',
  APARTMENT: 'apartment',
  SHOP: 'shop',
  MANSION: 'mansion',

  // nature
  TREE: 'tree',
  TREE_CLUSTER: 'tree-cluster',
  HEDGE: 'hedge',
  TREE_ROUND: 'tree-round',
  TREE_ROUND_2: 'tree-round-2',
  TREE_BLOSSOM: 'tree-blossom',
  TREE_PINE: 'tree-pine',
  TREE_CYPRESS: 'tree-cypress',
  FLOWER_BUSH: 'flower-bush',
  ROCKS: 'rocks',
  BUSH: 'bush',
  BUSH_SMALL: 'bush-small',
  HEDGE_ROW: 'hedge-row',
  GRASS_PATCH: 'grass-patch',

  // agriculture
  SOIL_PATCH: 'soil-patch',
  CROP_CARROT: 'crop-carrot',
  FENCE: 'fence',
  HAYSTACK: 'haystack',
  FIELD_VEG: 'field-veg',
  FIELD_WHEAT: 'field-wheat',
  GREENHOUSE: 'greenhouse',
  WINDMILL: 'windmill',
  HAYSTACK_BIG: 'haystack-big',

  // dam / water infrastructure
  DAM_WALL: 'dam-wall',
  DAM_PILLAR: 'dam-pillar',
  DAM_BASIN: 'dam-basin',
  DAM_STRUCTURE: 'dam-structure',
  TREATMENT_PLANT: 'treatment-plant',
  RESERVOIR_PANORAMA: 'reservoir-panorama',
  LAKE_GROUND: 'lake-ground',
  DAM_FRONT: 'dam-front',
  PLAYGROUND: 'playground',
  GAZEBO: 'gazebo',
  DOCK: 'dock',
  STREET_LEAK: 'street-leak',
  PIPE_TRENCH: 'pipe-trench',

  // props
  CHEST: 'chest',
  BARREL: 'barrel',
  STREET_LAMP: 'street-lamp',
  SIGN: 'sign',
  FOUNTAIN: 'fountain',
  PLANTER: 'planter',
  TRASH_CAN: 'trash-can',
  BENCH: 'bench',
  BENCH_2: 'bench-2',
  CAR_BLUE: 'car-blue',
  CAR_WHITE: 'car-white',
  TRACTOR: 'tractor',
  CRATE: 'crate',
  BARREL_WOOD: 'barrel-wood',
  BARREL_WOOD_2: 'barrel-wood-2',
  RAIN_TANK: 'rainwater-tank',

  // characters
  PLAYER: 'player',
  NPC_SET_A: 'npc-set-a',
  NPC_SET_B: 'npc-set-b',
  LINA: 'lina',
  MAYOR: 'mayor',
  WOMAN: 'woman',
  ELIF_TEYZE: 'elif-teyze',
  ENGINEER_AYLIN: 'engineer-aylin',
  FARMER_RIZA: 'farmer-riza',
  NURI_AMCA: 'nuri-amca',
  WORKER_KEMAL: 'worker-kemal',
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];

export const SoundKeys = {
  AMBIENCE_BIRDS: 'ambience-birds',
  AMBIENCE_FOREST: 'ambience-forest',
  AMBIENCE_CITY: 'ambience-city',
  STEP: 'step',
  DIALOGUE: 'dialogue',
  TICK: 'tick',
  COMPLETE: 'complete',
  ALERT: 'alert',
  PAGE: 'page',
} as const;

export type SoundKey = (typeof SoundKeys)[keyof typeof SoundKeys];

/** Files live in `public/assets/audio/`; every sound loads with `this.load.audio()`. */
export const AUDIO_ASSETS: readonly { key: SoundKey; path: string }[] = [
  { key: SoundKeys.AMBIENCE_BIRDS, path: 'assets/audio/ambience-birds.mp3' },
  { key: SoundKeys.AMBIENCE_FOREST, path: 'assets/audio/ambience-forest.mp3' },
  { key: SoundKeys.AMBIENCE_CITY, path: 'assets/audio/ambience-city.mp3' },
  { key: SoundKeys.STEP, path: 'assets/audio/step.mp3' },
  { key: SoundKeys.DIALOGUE, path: 'assets/audio/dialogue.mp3' },
  { key: SoundKeys.TICK, path: 'assets/audio/tick.mp3' },
  { key: SoundKeys.COMPLETE, path: 'assets/audio/complete.mp3' },
  { key: SoundKeys.ALERT, path: 'assets/audio/alert.mp3' },
  { key: SoundKeys.PAGE, path: 'assets/audio/page.mp3' },
];

export interface ImageAsset {
  key: TextureKey;
  path: string;
  /** Native pixel size of the file. */
  width: number;
  height: number;
  /**
   * `true` = smooth illustrated art -> rendered with LINEAR filtering so the
   * sub-1 scaling stays clean. Omitted = pixel art -> NEAREST under `pixelArt`.
   */
  smooth?: boolean;
}

/** Plain images, loaded with `this.load.image()`. */
export const IMAGE_ASSETS: readonly ImageAsset[] = [
  // --- pixel-art ground tiles (legacy atlas, still the seamless base) ---
  // Hand-painted seamless ground (Gemini, matched to the building art) —
  // tiled at 0.5 so one 1024px texture covers 512 world px.
  { key: TextureKeys.GROUND_GRASS, path: 'assets/ground/grass-paint.webp', width: 1024, height: 1024, smooth: true },
  { key: TextureKeys.GROUND_GRASS_DRY, path: 'assets/ground/grass-paint-dry.webp', width: 1024, height: 1024, smooth: true },
  { key: TextureKeys.GROUND_GRASS_LUSH, path: 'assets/ground/grass-paint-lush.webp', width: 1024, height: 1024, smooth: true },
  { key: TextureKeys.GROUND_PATH, path: 'assets/ground/cobble-plaza.webp', width: 1024, height: 1024, smooth: true },
  { key: TextureKeys.GROUND_DIRT, path: 'assets/ground/dirt-path.webp', width: 1024, height: 1024, smooth: true },
  { key: TextureKeys.WATER, path: 'assets/water/water-tile.png', width: 16, height: 16 },

  // --- smooth illustrated tiles, sliced from allassets.png ---
  { key: TextureKeys.WATER_DEEP, path: 'assets/water/water-deep.png', width: 106, height: 120, smooth: true },
  // Edge rows/columns on the tiling axis cropped + made opaque: the old
  // semi-transparent rims let grass show through as lines between tiles.
  { key: TextureKeys.ROAD_STRAIGHT, path: 'assets/ground/road-straight-v2.png', width: 194, height: 88, smooth: true },
  { key: TextureKeys.ROAD_DASH, path: 'assets/ground/road-dash-v2.png', width: 148, height: 127, smooth: true },
  // Plain asphalt (from the road tile's marking-free band) for crossings.
  { key: TextureKeys.ROAD_JUNCTION, path: 'assets/ground/road-junction.png', width: 148, height: 148, smooth: true },

  // --- pixel-art buildings (kept as fallback, not currently placed) ---
  { key: TextureKeys.TOWN_HALL, path: 'assets/buildings/town-hall.png', width: 96, height: 109 },
  { key: TextureKeys.HOUSE, path: 'assets/buildings/house.png', width: 48, height: 132 },
  { key: TextureKeys.WALL_PANEL, path: 'assets/buildings/wall-panel.png', width: 48, height: 64 },

  // --- smooth illustrated buildings ---
  { key: TextureKeys.MUNICIPALITY, path: 'assets/buildings/belediye.png', width: 364, height: 304, smooth: true },
  { key: TextureKeys.HOUSE_RED, path: 'assets/buildings/house-red.png', width: 273, height: 268, smooth: true },
  { key: TextureKeys.FARMHOUSE, path: 'assets/buildings/farmhouse.png', width: 274, height: 248, smooth: true },
  { key: TextureKeys.APARTMENT, path: 'assets/buildings/apartment.png', width: 222, height: 256, smooth: true },
  { key: TextureKeys.SHOP, path: 'assets/buildings/shop.png', width: 207, height: 215, smooth: true },
  { key: TextureKeys.MANSION, path: 'assets/buildings/mansion.png', width: 1093, height: 925, smooth: true },

  // --- pixel-art nature (fallback) ---
  { key: TextureKeys.TREE, path: 'assets/nature/tree.png', width: 15, height: 77 },
  { key: TextureKeys.TREE_CLUSTER, path: 'assets/nature/tree-cluster.png', width: 54, height: 101 },
  { key: TextureKeys.HEDGE, path: 'assets/nature/hedge.png', width: 16, height: 64 },

  // --- smooth illustrated nature ---
  { key: TextureKeys.TREE_ROUND, path: 'assets/nature/tree-round.png', width: 159, height: 189, smooth: true },
  { key: TextureKeys.TREE_ROUND_2, path: 'assets/nature/tree-round-2.png', width: 130, height: 180, smooth: true },
  { key: TextureKeys.TREE_BLOSSOM, path: 'assets/nature/tree-blossom.png', width: 128, height: 175, smooth: true },
  { key: TextureKeys.TREE_PINE, path: 'assets/nature/tree-pine.png', width: 111, height: 181, smooth: true },
  { key: TextureKeys.TREE_CYPRESS, path: 'assets/nature/tree-cypress.png', width: 63, height: 176, smooth: true },
  { key: TextureKeys.FLOWER_BUSH, path: 'assets/nature/flower-bush.png', width: 97, height: 84, smooth: true },
  { key: TextureKeys.ROCKS, path: 'assets/nature/rocks.png', width: 114, height: 78, smooth: true },
  { key: TextureKeys.BUSH, path: 'assets/nature/bush.png', width: 85, height: 66, smooth: true },
  { key: TextureKeys.BUSH_SMALL, path: 'assets/nature/bush-small.png', width: 52, height: 63, smooth: true },
  { key: TextureKeys.HEDGE_ROW, path: 'assets/nature/hedge-row.png', width: 158, height: 75, smooth: true },
  { key: TextureKeys.GRASS_PATCH, path: 'assets/nature/grass-patch.png', width: 86, height: 41, smooth: true },

  // --- agriculture ---
  { key: TextureKeys.SOIL_PATCH, path: 'assets/agriculture/soil-patch.png', width: 48, height: 45 },
  { key: TextureKeys.CROP_CARROT, path: 'assets/agriculture/crop-carrot.png', width: 32, height: 21 },
  { key: TextureKeys.FENCE, path: 'assets/agriculture/fence.png', width: 52, height: 32 },
  { key: TextureKeys.HAYSTACK, path: 'assets/agriculture/haystack.png', width: 13, height: 24 },
  { key: TextureKeys.FIELD_VEG, path: 'assets/agriculture/field-veg.png', width: 174, height: 196, smooth: true },
  { key: TextureKeys.FIELD_WHEAT, path: 'assets/agriculture/field-wheat.png', width: 198, height: 197, smooth: true },
  { key: TextureKeys.GREENHOUSE, path: 'assets/agriculture/greenhouse.png', width: 230, height: 183, smooth: true },
  { key: TextureKeys.WINDMILL, path: 'assets/agriculture/windmill.png', width: 84, height: 209, smooth: true },
  { key: TextureKeys.HAYSTACK_BIG, path: 'assets/agriculture/haystack-big.png', width: 64, height: 64, smooth: true },

  // --- dam / water infrastructure ---
  { key: TextureKeys.DAM_WALL, path: 'assets/water/dam-wall.png', width: 48, height: 40 },
  { key: TextureKeys.DAM_PILLAR, path: 'assets/water/dam-pillar.png', width: 16, height: 40 },
  { key: TextureKeys.DAM_BASIN, path: 'assets/water/dam-basin.png', width: 94, height: 68 },
  { key: TextureKeys.DAM_STRUCTURE, path: 'assets/water/dam-structure.png', width: 345, height: 223, smooth: true },
  { key: TextureKeys.TREATMENT_PLANT, path: 'assets/water/treatment-plant.png', width: 274, height: 213, smooth: true },
  // Lake/dam panorama: Unity layout repainted at 1.6 px per world px (Gemini, 3 parts).
  // Lake = textured water + sand only (trees, rocks and the dam are real
  // world sprites on top), painted at 1.6 px per world px.
  { key: TextureKeys.LAKE_GROUND, path: 'assets/maps/lake-ground.webp', width: 3075, height: 1024, smooth: true },
  { key: TextureKeys.DAM_FRONT, path: 'assets/water/dam-front.webp', width: 1000, height: 474, smooth: true },
  { key: TextureKeys.PLAYGROUND, path: 'assets/props/playground.webp', width: 600, height: 436, smooth: true },
  { key: TextureKeys.GAZEBO, path: 'assets/props/gazebo.webp', width: 449, height: 520, smooth: true },
  { key: TextureKeys.RESERVOIR_PANORAMA, path: 'assets/maps/reservoir-panorama.webp', width: 3075, height: 1024, smooth: true },
  { key: TextureKeys.DOCK, path: 'assets/props/dock.png', width: 94, height: 127, smooth: true },
  // Chapter-2 street states: the leak beside Nuri's street, then the open trench.
  { key: TextureKeys.STREET_LEAK, path: 'assets/water/street-leak.png', width: 1254, height: 1254, smooth: true },
  { key: TextureKeys.PIPE_TRENCH, path: 'assets/water/pipe-trench.png', width: 1254, height: 1254, smooth: true },

  // --- props ---
  { key: TextureKeys.CHEST, path: 'assets/props/chest.png', width: 13, height: 12 },
  { key: TextureKeys.BARREL, path: 'assets/props/barrel.png', width: 12, height: 16 },
  { key: TextureKeys.STREET_LAMP, path: 'assets/props/street-lamp.png', width: 40, height: 165, smooth: true },
  { key: TextureKeys.SIGN, path: 'assets/props/sign.png', width: 70, height: 144, smooth: true },
  { key: TextureKeys.FOUNTAIN, path: 'assets/props/fountain.png', width: 168, height: 173, smooth: true },
  { key: TextureKeys.PLANTER, path: 'assets/props/planter.png', width: 87, height: 102, smooth: true },
  { key: TextureKeys.TRASH_CAN, path: 'assets/props/trash-can.png', width: 46, height: 78, smooth: true },
  { key: TextureKeys.BENCH, path: 'assets/props/bench.png', width: 102, height: 68, smooth: true },
  { key: TextureKeys.BENCH_2, path: 'assets/props/bench-2.png', width: 77, height: 40, smooth: true },
  { key: TextureKeys.CAR_BLUE, path: 'assets/props/car-blue.png', width: 63, height: 127, smooth: true },
  { key: TextureKeys.CAR_WHITE, path: 'assets/props/car-white.png', width: 55, height: 123, smooth: true },
  { key: TextureKeys.TRACTOR, path: 'assets/props/tractor.png', width: 75, height: 133, smooth: true },
  { key: TextureKeys.CRATE, path: 'assets/props/crate.png', width: 66, height: 70, smooth: true },
  { key: TextureKeys.BARREL_WOOD, path: 'assets/props/barrel-wood.png', width: 40, height: 55, smooth: true },
  { key: TextureKeys.BARREL_WOOD_2, path: 'assets/props/barrel-wood-2.png', width: 43, height: 57, smooth: true },
  { key: TextureKeys.RAIN_TANK, path: 'assets/props/rainwater-tank.png', width: 1254, height: 1254, smooth: true },
] as const;

export interface SpritesheetAsset extends ImageAsset {
  frameWidth: number;
  frameHeight: number;
  /** Frames per row, for readable frame-index maths. */
  columns: number;
  rows: number;
  /** Transparent border around the sheet and between frames (anti-bleed). */
  margin?: number;
  spacing?: number;
}

/**
 * Character sheets.
 *
 * The smooth characters are 1x4 strips composed by `tools/slice-allassets.mjs`
 * from `allassets.png` or `yenikarakterler.png`. Frame order is always
 * [down, right, up, left]. Each strip holds ONE pose per direction - there
 * are no walk cycles, so the scene plays single-frame "animations" and adds
 * a small waddle tween while moving.
 *
 * `npc-set-*`: legacy 3x4 pixel grids (multi-character sheets, no walk
 * frames). Kept loaded as fallback but not currently placed.
 */
export const SPRITESHEET_ASSETS: readonly SpritesheetAsset[] = [
  {
    key: TextureKeys.PLAYER,
    path: 'assets/characters/playerboy_walk.png',
    width: 753,
    height: 1608,
    frameWidth: 251,
    frameHeight: 402,
    columns: 3,
    rows: 4,
    smooth: true,
  },
  {
    key: TextureKeys.LINA,
    path: 'assets/characters/lina_walk.png',
    width: 852,
    height: 1564,
    frameWidth: 284,
    frameHeight: 391,
    columns: 3,
    rows: 4,
    smooth: true,
  },
  {
    key: TextureKeys.MAYOR,
    path: 'assets/characters/mayor.png',
    width: 188,
    height: 105,
    frameWidth: 47,
    frameHeight: 105,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.WOMAN,
    path: 'assets/characters/woman.png',
    width: 184,
    height: 96,
    frameWidth: 46,
    frameHeight: 96,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.ELIF_TEYZE,
    path: 'assets/characters/elif-teyze.png',
    width: 2172,
    height: 724,
    frameWidth: 543,
    frameHeight: 724,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.ENGINEER_AYLIN,
    path: 'assets/characters/muhendis-aylin.png',
    width: 872,
    height: 433,
    frameWidth: 218,
    frameHeight: 433,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.FARMER_RIZA,
    path: 'assets/characters/ciftci-riza.png',
    width: 1088,
    height: 441,
    frameWidth: 272,
    frameHeight: 441,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.NURI_AMCA,
    path: 'assets/characters/nuri-amca.png',
    width: 884,
    height: 399,
    frameWidth: 221,
    frameHeight: 399,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.WORKER_KEMAL,
    path: 'assets/characters/isci-kemal.png',
    width: 976,
    height: 403,
    frameWidth: 244,
    frameHeight: 403,
    columns: 4,
    rows: 1,
    smooth: true,
  },
  {
    key: TextureKeys.NPC_SET_A,
    path: 'assets/characters/npc-01.png',
    width: 48,
    height: 64,
    frameWidth: 16,
    frameHeight: 16,
    columns: 3,
    rows: 4,
  },
  {
    key: TextureKeys.NPC_SET_B,
    path: 'assets/characters/npc-02.png',
    width: 48,
    height: 64,
    frameWidth: 16,
    frameHeight: 16,
    columns: 3,
    rows: 4,
  },
] as const;

/** Player pose keys - each maps to a single frame on the strip. */
export const PlayerAnims = {
  WALK_DOWN: 'player-walk-down',
  WALK_RIGHT: 'player-walk-right',
  WALK_UP: 'player-walk-up',
  WALK_LEFT: 'player-walk-left',
} as const;

export type PlayerAnimKey = (typeof PlayerAnims)[keyof typeof PlayerAnims];

/**
 * The 3x4 walk sheets: rows are [down, right, up, left] and each row holds
 * [left-foot, passing/idle, right-foot]. Playing the row as [0,1,2,1] loops a
 * smooth gait; the middle frame is the standing pose.
 */
export const PLAYER_ANIM_FRAMES = {
  [PlayerAnims.WALK_DOWN]: { frames: [0, 1, 2, 1], idle: 1 },
  [PlayerAnims.WALK_RIGHT]: { frames: [3, 4, 5, 4], idle: 4 },
  [PlayerAnims.WALK_UP]: { frames: [6, 7, 8, 7], idle: 7 },
  [PlayerAnims.WALK_LEFT]: { frames: [9, 10, 11, 10], idle: 10 },
} as const;

/** Lina's sheet shares the player's 3x4 layout; keyed by direction name. */
export const LINA_ANIM_FRAMES = {
  down: [0, 1, 2, 1],
  right: [3, 4, 5, 4],
  up: [6, 7, 8, 7],
  left: [9, 10, 11, 10],
} as const;

export const LINA_IDLE_FRAMES = { down: 1, right: 4, up: 7, left: 10 } as const;
