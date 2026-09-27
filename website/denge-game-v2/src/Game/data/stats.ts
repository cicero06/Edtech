/**
 * The four balance axes the game is named after ("denge" = balance).
 *
 * Values and decision effects are carried over unchanged from the prototype so
 * the full interaction round-trip can be verified against known numbers.
 *
 * Stats currently live in React state only. When the simulation side is built,
 * this module is the place to grow - not the scene.
 */

export interface GameStats {
  environment: number;
  economy: number;
  society: number;
  water: number;
}

export type StatChanges = Partial<GameStats>;

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export const INITIAL_STATS: GameStats = {
  environment: 50,
  economy: 50,
  society: 50,
  water: 50,
};

/** Display metadata for the HUD, so App.tsx holds no copy of the stat list. */
export const STAT_META: readonly { key: keyof GameStats; icon: string; label: string }[] = [
  { key: 'environment', icon: '🌱', label: 'Çevre' },
  { key: 'economy', icon: '💰', label: 'Ekonomi' },
  { key: 'society', icon: '👥', label: 'Toplum' },
  { key: 'water', icon: '💧', label: 'Su' },
] as const;

/** Keyed by the dialogue choice ids defined in `npcs.ts`. */
export const DECISION_EFFECTS: Record<string, StatChanges> = {
  'repair-well': { water: 20, economy: -10, society: 5 },
  'reduce-water': { water: 10, environment: 10, society: -5 },
  'ask-town': { society: 15, economy: -5, water: 5 },
};

function clamp(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, value));
}

/** Returns a new stats object; never mutates the input. */
export function applyDecision(stats: GameStats, choiceId: string): GameStats {
  const effects = DECISION_EFFECTS[choiceId];
  if (!effects) return stats;
  return applyStatChanges(stats, effects);
}

/** Applies any number of stat deltas (e.g. the picked solution cards). */
export function applyStatChanges(stats: GameStats, ...changes: StatChanges[]): GameStats {
  const next = { ...stats };
  for (const change of changes) {
    next.environment = clamp(next.environment + (change.environment ?? 0));
    next.economy = clamp(next.economy + (change.economy ?? 0));
    next.society = clamp(next.society + (change.society ?? 0));
    next.water = clamp(next.water + (change.water ?? 0));
  }
  return next;
}
