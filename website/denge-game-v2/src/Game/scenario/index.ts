/**
 * The game's door to the scenario engine: which variant the active student
 * plays, and the scenario-aware versions of the story pieces that quote
 * numbers or results. Everything here reads the session; model/variants/
 * texts stay pure so the build-time checker can load them in Node.
 */
import {
  investigationCard,
  implementationTwist,
  type ChartSeries,
  type InvestigationCard,
  type SolutionCard,
} from '../data/story';
import { loadSession, type GameSession } from '../data/session';
import type { StatChanges } from '../data/stats';
import { facts, simulate, type Outcome, type ScenarioFacts, type SolutionId } from './model';
import { say, type BeatId, type TextContext } from './texts';
import { DEFAULT_PARAMS, type ScenarioState } from './variants';

/** Old saves (before the engine) keep the numbers they were already shown. */
export function scenarioOf(session: GameSession | null | undefined): ScenarioState {
  return session?.scenario ?? { seed: session?.studentId ?? 'default', params: DEFAULT_PARAMS };
}

export function activeScenario(): ScenarioState {
  return scenarioOf(loadSession());
}

export function activeFacts(): ScenarioFacts {
  return facts(activeScenario().params);
}

function ctx(state: ScenarioState, picks?: readonly string[]): TextContext {
  return {
    f: facts(state.params),
    o: picks ? simulate(state.params, picks) : undefined,
    seed: state.seed,
  };
}

const line = (beat: BeatId, c: TextContext) => say(beat, c);

/** A district card with this student's numbers (hint, datum, chart, explanation). */
export function scenarioCard(id: string, state: ScenarioState = activeScenario()): InvestigationCard | undefined {
  const card = investigationCard(id);
  if (!card) return card;
  const c = ctx(state);
  const f = c.f;
  switch (card.id) {
    case 'baraj':
      return {
        ...card,
        hint: line('baraj.hint', c) ?? card.hint,
        datum: line('baraj.datum', c) ?? undefined,
        chart: card.chart && {
          ...card.chart,
          points: [
            { label: 'Geçen yıl', value: f.history.lastYear },
            { label: 'Kış', value: f.history.winter },
            { label: 'Bahar', value: f.history.spring },
            { label: 'Bugün', value: f.history.today },
          ],
        },
        checkQuestion: card.checkQuestion && {
          ...card.checkQuestion,
          explanation: line('baraj.explanation', c) ?? card.checkQuestion.explanation,
        },
      };
    case 'konut':
      return { ...card, datum: line('konut.datum', c) ?? undefined };
    case 'park':
      return { ...card, datum: line('park.datum', c) ?? undefined };
    default:
      return card;
  }
}

/** The day-30 report the plan earns in this student's town. */
export interface ReviewOutcome {
  text: string;
  finding: { icon: string; text: string; datum?: string };
  chart?: ChartSeries;
}

const REVIEW_BEATS: Record<string, { icon: string; review: BeatId; finding: BeatId; datum: BeatId; extra?: BeatId }> = {
  'muhendis-aylin': { icon: '💧', review: 'aylin.review', finding: 'aylin.finding', datum: 'aylin.datum', extra: 'aylin.rainNote' },
  'ciftci-riza': { icon: '🌾', review: 'riza.review', finding: 'riza.finding', datum: 'riza.datum' },
  'nuri-amca': { icon: '🏠', review: 'nuri.review', finding: 'nuri.finding', datum: 'nuri.datum' },
  'isci-kemal': { icon: '🌳', review: 'kemal.review', finding: 'kemal.finding', datum: 'kemal.datum' },
};

export function reviewOutcome(
  npcId: string,
  picks: readonly string[],
  state: ScenarioState = activeScenario(),
): ReviewOutcome | null {
  const beats = REVIEW_BEATS[npcId];
  if (!beats) return null;
  const c = ctx(state, picks);
  const text = line(beats.review, c);
  const finding = line(beats.finding, c);
  // Nothing consistent to say → the resident says nothing scripted.
  if (!text || !finding) return null;
  const extra = beats.extra ? line(beats.extra, c) : null;
  const o = c.o as Outcome;
  return {
    text: extra ? `${text} ${extra}` : text,
    finding: { icon: beats.icon, text: finding, datum: line(beats.datum, c) ?? undefined },
    chart:
      npcId === 'muhendis-aylin'
        ? {
            title: 'Rezerv Su Seviyesi',
            unit: '%',
            points: [
              { label: 'Plan öncesi', value: o.reservoirBefore },
              { label: 'Plansız olsaydı', value: o.reservoirNoPlan },
              // Last bar is highlighted by ChartView — the student's own result.
              { label: 'Planla 30. gün', value: o.reservoirAfter },
            ],
          }
        : undefined,
  };
}

/** Mid-month twist; the repair crews' line quotes the reservoir, so it comes from the bank. */
export function scenarioTwist(picks: readonly string[], state: ScenarioState = activeScenario()): string | null {
  const twist = implementationTwist(picks);
  if (!twist) return null;
  if (twist.startsWith('Kaçaklar kapandı')) return line('twist.repair', ctx(state, picks));
  return twist;
}

/** Whether a twist line carries scenario numbers/claims (its old recording would disagree). */
export function twistIsScenarioText(picks: readonly string[]): boolean {
  return !!implementationTwist(picks)?.startsWith('Kaçaklar kapandı');
}

/** Water-axis points per reservoir point a measure adds (keeps the HUD scale of the old cards). */
const WATER_STAT_PER_POINT = 4;

/**
 * Stat changes for a submitted plan: economy/society/environment as on the
 * cards, but the water axis follows what each measure actually gave back in
 * this student's town.
 */
export function planEffects(
  selected: readonly SolutionCard[],
  state: ScenarioState = activeScenario(),
): StatChanges[] {
  const o = simulate(state.params, selected.map((c) => c.id));
  return selected.map((card) => ({
    ...card.effects,
    water: Math.round((o.contributionPts[card.id as SolutionId] ?? 0) * WATER_STAT_PER_POINT),
  }));
}

/** Short variant summary for the teacher report. */
export function scenarioSummary(state: ScenarioState): string {
  const f = facts(state.params);
  return `Baraj çıkışı ${f.outflowL} L/dk · kaçak ${f.leakL} L/dk (%${f.leakPct}) · rezerv %${f.reservoirPct} · yağış açığı %${f.rainDeficitPct}`;
}
