/**
 * Per-student scenario variants. Every student gets the same story and the
 * same causal model (model.ts) with different, plausible numbers — so the
 * answers can't be memorised or copied from a classmate, while the learning
 * goal and the fairness of comparison stay the same.
 *
 * Deterministic: the same seed always yields the same variant, so a student
 * who reloads sees the same town.
 */
import type { ScenarioParams } from './model';

/** The numbers the game shipped with — old saves (no scenario) keep them. */
export const DEFAULT_PARAMS: ScenarioParams = {
  outflowL: 80,
  leakL: 20,
  parkL: 25,
  farmL: 40,
  reservoirPct: 43,
  drops: [6, 9, 12],
  rainDeficitPct: 42,
  evaporationPct: 28,
};

/** Stored on the session so the variant survives reloads and reaches the teacher. */
export interface ScenarioState {
  seed: string;
  params: ScenarioParams;
}

/** FNV-1a: stable 32-bit hash of the seed string. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for picking plausible numbers. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parameter space — narrow, realistic ranges (yol haritası §5 Adım 4). */
export const PARAM_SPACE = {
  outflowL: [72, 76, 80, 84, 88, 92, 96],
  leakPct: [20, 22, 24, 25, 26, 28, 30],
  parkPct: [36, 38, 40, 42, 44],
  farmL: [32, 34, 36, 38, 40, 42, 44],
  reservoirPct: [38, 39, 40, 41, 42, 43, 44, 45, 46],
  firstDrop: [5, 6, 7],
  rainDeficitPct: [34, 36, 38, 40, 42, 44, 46, 48],
  evaporationPct: [22, 24, 26, 28, 30, 32],
} as const;

/** Builds a variant from explicit choices — shared by the generator and the checker's grid. */
export function buildParams(choice: {
  outflowL: number;
  leakPct: number;
  parkPct: number;
  farmL: number;
  reservoirPct: number;
  drops: readonly [number, number, number];
  rainDeficitPct: number;
  evaporationPct: number;
}): ScenarioParams {
  const leakL = Math.round((choice.outflowL * choice.leakPct) / 100);
  const parkL = Math.round(((choice.outflowL - leakL) * choice.parkPct) / 100);
  return {
    outflowL: choice.outflowL,
    leakL,
    parkL,
    farmL: choice.farmL,
    reservoirPct: choice.reservoirPct,
    drops: choice.drops,
    rainDeficitPct: choice.rainDeficitPct,
    evaporationPct: choice.evaporationPct,
  };
}

export function createScenario(seed: string): ScenarioState {
  const next = rng(hash(seed));
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const first = pick(PARAM_SPACE.firstDrop);
  const second = first + 2 + Math.floor(next() * 2); // +2..+3
  const third = second + 2 + Math.floor(next() * 3); // +2..+4 — today's drop is the fastest
  const params = buildParams({
    outflowL: pick(PARAM_SPACE.outflowL),
    leakPct: pick(PARAM_SPACE.leakPct),
    parkPct: pick(PARAM_SPACE.parkPct),
    farmL: pick(PARAM_SPACE.farmL),
    reservoirPct: pick(PARAM_SPACE.reservoirPct),
    drops: [first, second, third],
    rainDeficitPct: pick(PARAM_SPACE.rainDeficitPct),
    evaporationPct: pick(PARAM_SPACE.evaporationPct),
  });
  return { seed, params };
}
