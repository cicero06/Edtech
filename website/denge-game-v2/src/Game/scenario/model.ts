/**
 * Kasaba modeli — the single source of every number the town says.
 *
 * Each student plays a variant (variants.ts) of the same causal water model:
 * the dam's outflow splits into homes, park and an underground leak; the
 * fields draw from their own canal; the reservoir falls with the drought and
 * every measure the plan picks gives back litres. Outcomes are COMPUTED from
 * these causes, so two measures together always show both effects, and no
 * sentence can claim something the model did not produce (texts.ts).
 *
 * Units: flows in litres per minute (L/dk), reservoir in percent points.
 */

export const SOLUTION_IDS = [
  'fountains-off',
  'saving-campaign',
  'repair-pipes',
  'drip-irrigation',
  'rain-harvest',
] as const;
export type SolutionId = (typeof SOLUTION_IDS)[number];

/** What a variant fixes. Integers only — every shown number derives from these. */
export interface ScenarioParams {
  /** Water leaving the dam towards town (L/dk). */
  outflowL: number;
  /** Lost underground before reaching anyone (L/dk). */
  leakL: number;
  /** Reaching the park (L/dk); the homes get the rest. */
  parkL: number;
  /** Fields' own canal draw (L/dk). */
  farmL: number;
  /** Reservoir today (%). */
  reservoirPct: number;
  /** Season-on-season reservoir drops, oldest first; strictly growing. */
  drops: readonly [number, number, number];
  /** Rainfall below normal (%). */
  rainDeficitPct: number;
  /** Rise in evaporation (%). */
  evaporationPct: number;
}

/** The numbers the bank may quote before any plan, all derived from params. */
export interface ScenarioFacts {
  outflowL: number;
  leakL: number;
  parkL: number;
  homesL: number;
  deliveredL: number;
  /** Share of the outflow lost, rounded once here — texts never recompute it. */
  leakPct: number;
  farmL: number;
  reservoirPct: number;
  /** Reservoir history for the dam chart: last year, winter, spring, today. */
  history: { lastYear: number; winter: number; spring: number; today: number };
  drops: readonly [number, number, number];
  rainDeficitPct: number;
  evaporationPct: number;
  /** Alarm threshold Aylin watches — always below today's level. */
  criticalPct: number;
  /** Aylin's workshop: loss left after each of her three repair choices (%). */
  aylinRemainPct: { patch: number; replace: number; sensor: number };
  /** Kemal's workshop: litres the re-aimed sprinklers save, and what the park draws after. */
  kemalSaveL: number;
  kemalAfterL: number;
}

/** Reservoir points one litre-per-minute saved over the month is worth. */
const POINTS_PER_L = 0.25;
/** Share of the leak a repair crew closes (old pipes never get to exactly 0). */
const REPAIR_SHARE = 0.9;
/** Homes' saving from the campaign. */
const CAMPAIGN_SHARE = 0.1;
/** Fountains' share of the park's draw. */
const FOUNTAIN_SHARE = 0.3;
/** Drip irrigation's saving on the fields' canal. */
const DRIP_SHARE = 0.35;
/** Rain-harvest capture in a normal month (L/dk equivalent) … */
const RAIN_CAPTURE_NORMAL_L = 18;
/** … and the share of the park's remaining draw the tanks take over. */
const RAIN_PARK_OFFSET = 0.5;

export function facts(params: ScenarioParams): ScenarioFacts {
  const { outflowL, leakL, parkL, farmL, reservoirPct, drops } = params;
  const deliveredL = outflowL - leakL;
  const leakPct = Math.round((leakL / outflowL) * 100);
  const spring = reservoirPct + drops[2];
  const winter = spring + drops[1];
  const lastYear = winter + drops[0];
  const kemalSaveL = Math.round(parkL * 0.4);
  return {
    outflowL,
    leakL,
    parkL,
    homesL: deliveredL - parkL,
    deliveredL,
    leakPct,
    farmL,
    reservoirPct,
    history: { lastYear, winter, spring, today: reservoirPct },
    drops,
    rainDeficitPct: params.rainDeficitPct,
    evaporationPct: params.evaporationPct,
    criticalPct: reservoirPct - 3,
    aylinRemainPct: {
      patch: Math.round(leakPct * 0.48),
      replace: 0,
      sensor: Math.round(leakPct * 0.72),
    },
    kemalSaveL,
    kemalAfterL: parkL - kemalSaveL,
  };
}

/** Day-30 result of a plan in this variant. */
export interface Outcome {
  picks: readonly SolutionId[];
  reservoirBefore: number;
  reservoirMid: number;
  reservoirAfter: number;
  /** After − before, in points (may be negative). */
  deltaPts: number;
  /** What the drought alone would have left (no plan at all). */
  reservoirNoPlan: number;
  /** Litres per minute each picked measure gives back. */
  savedL: Partial<Record<SolutionId, number>>;
  /** Reservoir points each picked measure added. */
  contributionPts: Partial<Record<SolutionId, number>>;
  /** Biggest contributor, if any measure was picked. */
  topContributor: SolutionId | null;
  leakFixed: boolean;
  /** Leak still flowing after the plan (L/dk). */
  leakAfterL: number;
  pressure: 'normal' | 'low';
  homesSavingL: number;
  parkSource: 'depo' | 'idareli' | 'şebeke';
  parkAfterL: number;
  farmState: 'verimli' | 'zor';
  farmAfterL: number;
  /** Repairs shut the water for two days — a cost the residents feel. */
  interruptionDays: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function simulate(params: ScenarioParams, picks: readonly string[]): Outcome {
  const f = facts(params);
  const has = (id: SolutionId) => picks.includes(id);
  const savedL: Partial<Record<SolutionId, number>> = {};

  if (has('repair-pipes')) savedL['repair-pipes'] = round1(f.leakL * REPAIR_SHARE);
  if (has('saving-campaign')) savedL['saving-campaign'] = round1(f.homesL * CAMPAIGN_SHARE);
  if (has('fountains-off')) savedL['fountains-off'] = round1(f.parkL * FOUNTAIN_SHARE);
  if (has('drip-irrigation')) savedL['drip-irrigation'] = round1(f.farmL * DRIP_SHARE);
  const parkDraw = f.parkL - (savedL['fountains-off'] ?? 0);
  if (has('rain-harvest')) {
    const capture = RAIN_CAPTURE_NORMAL_L * (1 - f.rainDeficitPct / 100);
    savedL['rain-harvest'] = round1(capture + parkDraw * RAIN_PARK_OFFSET);
  }

  const contributionPts: Partial<Record<SolutionId, number>> = {};
  let gained = 0;
  for (const id of SOLUTION_IDS) {
    const litres = savedL[id];
    if (litres === undefined) continue;
    contributionPts[id] = round1(litres * POINTS_PER_L);
    gained += litres * POINTS_PER_L;
  }
  const droughtDrop = f.rainDeficitPct / 10 + (f.evaporationPct - 20) / 10;
  const afterRaw = f.reservoirPct - droughtDrop + gained;
  const reservoirAfter = Math.round(afterRaw);
  const topContributor =
    (SOLUTION_IDS.filter((id) => contributionPts[id] !== undefined).sort(
      (a, b) => (contributionPts[b] ?? 0) - (contributionPts[a] ?? 0),
    )[0] as SolutionId | undefined) ?? null;

  const leakFixed = has('repair-pipes');
  const parkAfterL = Math.round(parkDraw * (has('rain-harvest') ? 1 - RAIN_PARK_OFFSET : 1));
  return {
    picks: SOLUTION_IDS.filter((id) => has(id)),
    reservoirBefore: f.reservoirPct,
    reservoirMid: Math.round(f.reservoirPct + (afterRaw - f.reservoirPct) / 2),
    reservoirAfter,
    deltaPts: reservoirAfter - f.reservoirPct,
    reservoirNoPlan: Math.round(f.reservoirPct - droughtDrop),
    savedL,
    contributionPts,
    topContributor,
    leakFixed,
    leakAfterL: leakFixed ? Math.round(f.leakL - (savedL['repair-pipes'] ?? 0)) : f.leakL,
    pressure: leakFixed ? 'normal' : 'low',
    homesSavingL: Math.round(savedL['saving-campaign'] ?? 0),
    parkSource: has('rain-harvest') ? 'depo' : has('fountains-off') ? 'idareli' : 'şebeke',
    parkAfterL,
    farmState: has('drip-irrigation') ? 'verimli' : 'zor',
    farmAfterL: Math.round(f.farmL - (savedL['drip-irrigation'] ?? 0)),
    interruptionDays: leakFixed ? 2 : 0,
  };
}
