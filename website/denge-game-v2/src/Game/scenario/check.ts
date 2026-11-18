/**
 * Consistency checker for the scenario engine (run: npm run check:scenarios).
 *
 * Renders EVERY phrasing of EVERY beat for a grid of variants × all 32 plan
 * subsets and fails on: digits typed into a template, unfilled slots, a
 * required beat with no branch, a sentence whose claim the model contradicts,
 * and broken model invariants (ledger, chart order, monotonic measures,
 * more than one reasonable plan, no single-measure silver bullet).
 */
import { SOLUTION_CARDS, SOLUTION_BUDGET } from '../data/story';
import { SOLUTION_IDS, facts, simulate, type ScenarioParams } from './model';
import { BEATS, falseClaims, fill, type BeatId, type TextContext } from './texts';
import { DEFAULT_PARAMS, PARAM_SPACE, buildParams, createScenario } from './variants';

/** Beats the game calls without an outcome. */
const FACT_BEATS: BeatId[] = ['baraj.hint', 'baraj.datum', 'baraj.explanation', 'konut.datum', 'park.datum'];
/** Beats the game calls on day 30 — every plan must get a sentence. */
const REQUIRED_OUTCOME_BEATS: BeatId[] = [
  'aylin.review', 'aylin.finding', 'aylin.datum',
  'riza.review', 'riza.finding', 'riza.datum',
  'nuri.review', 'nuri.finding', 'nuri.datum',
  'kemal.review', 'kemal.finding', 'kemal.datum',
];
/** Said only when relevant (may be silent). */
const OPTIONAL_OUTCOME_BEATS: BeatId[] = ['aylin.rainNote', 'twist.repair'];

const COST = Object.fromEntries(SOLUTION_CARDS.map((c) => [c.id, c.cost]));
const ALL_PLANS: string[][] = Array.from({ length: 1 << SOLUTION_IDS.length }, (_, mask) =>
  SOLUTION_IDS.filter((_, i) => mask & (1 << i)),
);
const affordable = (plan: string[]) => plan.reduce((sum, id) => sum + COST[id], 0) <= SOLUTION_BUDGET;

function grid(): ScenarioParams[] {
  const out: ScenarioParams[] = [DEFAULT_PARAMS];
  const ends = <T>(list: readonly T[]) => [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]];
  for (const outflowL of ends(PARAM_SPACE.outflowL))
    for (const leakPct of ends(PARAM_SPACE.leakPct))
      for (const parkPct of [PARAM_SPACE.parkPct[0], PARAM_SPACE.parkPct.at(-1)!])
        for (const farmL of [PARAM_SPACE.farmL[0], PARAM_SPACE.farmL.at(-1)!])
          for (const reservoirPct of ends(PARAM_SPACE.reservoirPct))
            for (const first of [5, 7])
              for (const rainDeficitPct of [PARAM_SPACE.rainDeficitPct[0], PARAM_SPACE.rainDeficitPct.at(-1)!])
                for (const evaporationPct of [PARAM_SPACE.evaporationPct[0], PARAM_SPACE.evaporationPct.at(-1)!])
                  out.push(
                    buildParams({
                      outflowL, leakPct, parkPct, farmL, reservoirPct,
                      drops: [first, first + 3, first + 7],
                      rainDeficitPct, evaporationPct,
                    }),
                  );
  for (let i = 0; i < 400; i++) out.push(createScenario(`check-${i}`).params);
  return out;
}

export interface CheckReport {
  errors: string[];
  variants: number;
  renders: number;
  branchHits: Record<string, number>;
  deltaRange: [number, number];
}

export function runChecks(): CheckReport {
  const errors: string[] = [];
  const err = (msg: string) => {
    if (errors.length < 60) errors.push(msg);
  };
  const branchHits: Record<string, number> = {};
  let renders = 0;
  let minDelta = Infinity;
  let maxDelta = -Infinity;

  // ---- 1. templates: no digits, slots exist --------------------------------
  const sample: TextContext = { f: facts(DEFAULT_PARAMS), o: simulate(DEFAULT_PARAMS, ['repair-pipes']), seed: 's' };
  for (const [id, beat] of Object.entries(BEATS)) {
    const slots = beat.slots(sample);
    beat.branches.forEach((branch, bi) => {
      branchHits[`${id}#${bi}`] = 0;
      for (const line of branch.lines) {
        const literal = line.replace(/\{\w+\}/g, '');
        if (/\d/.test(literal)) err(`${id}: template has a typed digit → "${line}"`);
        for (const [, key] of line.matchAll(/\{(\w+)\}/g)) {
          if (!(key in slots)) err(`${id}: unknown slot {${key}}`);
        }
      }
    });
  }

  const renderAll = (id: BeatId, c: TextContext, required: boolean, where: string) => {
    const beat = BEATS[id];
    const index = beat.branches.findIndex((b) => b.when(c));
    if (index < 0) {
      if (required) err(`${id}: no branch holds for ${where}`);
      return;
    }
    branchHits[`${id}#${index}`] += 1;
    const slots = beat.slots(c);
    for (const line of beat.branches[index].lines) {
      renders += 1;
      const text = fill(line, slots);
      if (/\{\w+\}/.test(text)) err(`${id}: unfilled slot for ${where} → "${text}"`);
      if (/\bNaN\b|undefined|Infinity/.test(text)) err(`${id}: bad value for ${where} → "${text}"`);
      const bad = falseClaims(text, c);
      if (bad.length) err(`${id}: false claim [${bad.join(', ')}] for ${where} → "${text}"`);
    }
  };

  const variants = grid();
  variants.forEach((params, vi) => {
    const f = facts(params);
    const where = `variant#${vi} ${JSON.stringify(params)}`;

    // ---- 2. model invariants ----------------------------------------------
    if (f.homesL + f.parkL + f.leakL !== f.outflowL) err(`ledger does not add up: ${where}`);
    if (f.leakL >= f.homesL) err(`leak not smaller than homes: ${where}`);
    const [d1, d2, d3] = f.drops;
    if (!(d1 < d2 && d2 < d3)) err(`chart drops not accelerating (check question breaks): ${where}`);
    if (f.criticalPct >= f.reservoirPct) err(`critical threshold not below today: ${where}`);
    if (!(f.aylinRemainPct.replace < f.aylinRemainPct.patch && f.aylinRemainPct.patch < f.aylinRemainPct.sensor && f.aylinRemainPct.sensor < f.leakPct)) {
      err(`Aylin remaining-loss order broken: ${where}`);
    }

    const outcomes = new Map(ALL_PLANS.map((plan) => [plan.join('+'), simulate(params, plan)]));
    for (const plan of ALL_PLANS) {
      const o = outcomes.get(plan.join('+'))!;
      minDelta = Math.min(minDelta, o.deltaPts);
      maxDelta = Math.max(maxDelta, o.deltaPts);
      for (const extra of SOLUTION_IDS) {
        if (plan.includes(extra)) continue;
        const bigger = outcomes.get(SOLUTION_IDS.filter((id) => plan.includes(id) || id === extra).join('+'))!;
        if (bigger.reservoirAfter < o.reservoirAfter) err(`adding ${extra} lowers the reservoir (${plan.join('+') || 'none'}): ${where}`);
      }
    }
    const reasonable = ALL_PLANS.filter((plan) => affordable(plan) && outcomes.get(plan.join('+'))!.deltaPts >= 0);
    if (reasonable.length < 2) err(`fewer than two affordable plans keep the reservoir: ${where}`);
    const bestSingle = Math.max(...SOLUTION_IDS.map((id) => outcomes.get(id)!.deltaPts));
    const bestPlan = Math.max(...ALL_PLANS.filter(affordable).map((plan) => outcomes.get(plan.join('+'))!.deltaPts));
    if (bestSingle >= bestPlan) err(`a single measure is as good as any plan: ${where}`);

    // ---- 3. every sentence, every plan --------------------------------------
    const seed = `seed-${vi}`;
    for (const id of FACT_BEATS) renderAll(id, { f, seed }, true, where);
    for (const plan of ALL_PLANS) {
      const c: TextContext = { f, o: outcomes.get(plan.join('+'))!, seed };
      const at = `${where} plan=${plan.join('+') || 'none'}`;
      for (const id of REQUIRED_OUTCOME_BEATS) renderAll(id, c, true, at);
      for (const id of OPTIONAL_OUTCOME_BEATS) renderAll(id, c, false, at);
    }
  });

  for (const [key, hits] of Object.entries(branchHits)) {
    if (hits === 0) err(`branch never reached (dead text): ${key}`);
  }
  return { errors, variants: variants.length, renders, branchHits, deltaRange: [minDelta, maxDelta] };
}
