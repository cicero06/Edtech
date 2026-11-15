/**
 * In-world parts of the district workshops — the bits the student does by
 * walking around town instead of inside a modal (ported from the Unity build,
 * where Kemal's sprinklers and Nuri's acoustic radar live on the map).
 *
 *   kemal-sprinklers — three real sprinklers in the park spray onto paths;
 *                      walk up and turn each one (E) onto grass.
 *   nuri-radar       — the leak is hidden under Çınar Caddesi; a radar bar
 *                      reads louder (dB) the closer the student walks.
 *
 * The scene owns the world state; React only draws the HUD from the
 * FIELD_TASK_STATUS events and reopens the workshop when the field part ends.
 */

export type FieldTaskId = 'kemal-sprinklers' | 'nuri-radar';

/** N, E, S, W — clockwise, matching the "turn" interaction. */
export type Dir = 0 | 1 | 2 | 3;
export type Surface = 'grass' | 'flowers' | 'trees' | 'asphalt' | 'pavement';

export interface SprinklerDef {
  id: string;
  x: number;
  y: number;
  /** What the spray lands on in each direction (N, E, S, W). */
  sides: readonly [Surface, Surface, Surface, Surface];
  labels: readonly [string, string, string, string];
  /** Where it points before the student fixes it — always a hard surface. */
  start: Dir;
}

export const isGreenSurface = (s: Surface) => s === 'grass' || s === 'flowers' || s === 'trees';

/** How far the spray reaches from the head, in world px. */
export const SPRAY_DISTANCE = 62;
export const SPRINKLER_RADIUS = 64;

/**
 * Open lawn spots in the park quadrants (checked against a coordinate grid
 * render): the E-W road runs at y≈709–797, the avenue asphalt at x≈939–1004
 * with the stone sidewalk east of it up to x≈1102.
 */
export const SPRINKLERS: readonly SprinklerDef[] = [
  // Park lawns at the corners of the central square (square x 990–1410,
  // y 785–1115; avenue y 906–994 with sidewalks either side).
  {
    id: 'park-nw',
    x: 960,
    y: 868,
    sides: ['trees', 'pavement', 'asphalt', 'grass'],
    labels: ['Ağaç sırası', 'Meydan taşları', 'Cadde asfaltı', 'Park çimi'],
    start: 2,
  },
  {
    id: 'park-ne',
    x: 1440,
    y: 868,
    sides: ['trees', 'flowers', 'asphalt', 'pavement'],
    labels: ['Kiraz ağaçları', 'Çiçek tarhı', 'Cadde asfaltı', 'Meydan taşları'],
    start: 2,
  },
  {
    id: 'park-sw',
    x: 960,
    y: 1090,
    sides: ['pavement', 'pavement', 'trees', 'grass'],
    labels: ['Kaldırım', 'Meydan taşları', 'Ağaç sırası', 'Park çimi'],
    start: 1,
  },
];

/** The first green direction reached by turning clockwise from `start`. */
export function solvedDir(def: SprinklerDef): Dir {
  let d = def.start;
  while (!isGreenSurface(def.sides[d])) d = ((d + 1) % 4) as Dir;
  return d;
}

/** Fewest turns that fix every sprinkler (rotation is clockwise only). */
export const SPRINKLER_MIN_ROTATIONS = SPRINKLERS.reduce(
  (sum, def) => sum + ((solvedDir(def) - def.start + 4) % 4),
  0,
);

// ---------------------------------------------------------------------------
// Nuri's acoustic radar
// ---------------------------------------------------------------------------

/** Hidden leak under Çınar Caddesi (the street ends at x≈1630), east of Nuri. */
export const LEAK_SPOT = { x: 1950, y: 948 } as const;
/** Inside this radius the radar peaks and the dig can start. */
export const LEAK_HOT_RADIUS = 52;
const RADAR_RANGE = 650;

/** 25 dB far away → 94 dB on top of the leak. */
export function radarDecibels(distance: number): number {
  const closeness = Math.min(1, Math.max(0, 1 - (distance - LEAK_HOT_RADIUS) / RADAR_RANGE));
  return Math.round(25 + 69 * closeness);
}

// ---------------------------------------------------------------------------
// Scene <-> React payloads
// ---------------------------------------------------------------------------

/** What the field part produced — handed to the workshop when it reopens. */
export type FieldResult =
  | { task: 'kemal-sprinklers'; rotations: number; extraTurns: number }
  | { task: 'nuri-radar'; seconds: number };

/** Live HUD data while a field task runs. */
export type FieldStatus =
  | { task: 'kemal-sprinklers'; aligned: number; total: number; near: string | null }
  | { task: 'nuri-radar'; db: number; trend: 'up' | 'down' | 'same'; hot: boolean };
