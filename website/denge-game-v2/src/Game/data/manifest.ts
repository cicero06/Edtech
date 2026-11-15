/**
 * Scenario manifest — the content contract the backend validates events
 * against (see demo/backend/src/atlas/events/event-catalog.ts).
 *
 * Everything here is *derived from story/npc/stat data*, never hand-copied:
 * the same ids the game renders are the ids the server accepts. Regenerate
 * the committed JSON with `npm run manifest` after any content change — the
 * version tag is a content hash, so a story edit always produces a new
 * ScenarioVersion instead of silently mutating an existing one.
 */
import {
  ANNOUNCE_ICONS,
  ANNOUNCE_NPC_IDS,
  EVIDENCE_IDS,
  INVESTIGATION_CARDS,
  LINA_CLOSING_CHOICES,
  EXPECTATION_CHOICES,
  RETRY_CHOICES,
  SOLUTION_BUDGET,
  SOLUTION_CARDS,
  mayorFollowUpChoices,
} from './story';
import { NPCS } from './npcs';
import { DECISION_EFFECTS } from './stats';
import { MINIGAMES } from './minigames';
import { DECISION_STEPS } from './decisions';

export const SCENARIO_KEY = 'denge-kasabasi';

/** Mirrors ScenarioManifest in the backend event catalog. */
export interface ScenarioManifest {
  /** Solution id -> cost, for server-side price/budget verification. */
  solutions: Record<string, number>;
  maxCost: number;
  /** Investigation card ids that may appear as `cardId`. */
  cards: string[];
  /** Hint ids that may be confirmed as evidence. */
  evidenceIds: string[];
  /** Announcement icon options. */
  icons: string[];
  /**
   * Ids the debrief report may classify — investigation card ids plus the
   * `finding-<npc>` entries the review round writes into the notebook.
   */
  reportItemIds: string[];
  /** Every dialogue choice id a `choice_made` event may carry. */
  choiceIds: string[];
  /** Workshop id -> decision ids its `minigame_completed` event may carry. */
  minigames: Record<string, string[]>;
  /** Decision-trace context -> step ids its `decision_step` events may carry. */
  decisionSteps: Record<string, string[]>;
}

export function buildScenarioManifest(): ScenarioManifest {
  const gapChoices = mayorFollowUpChoices([]).map((c) => c.id);
  const choiceIds = new Set<string>([
    ...Object.keys(DECISION_EFFECTS),
    ...NPCS.flatMap((npc) => npc.dialogue?.choices.map((c) => c.id) ?? []),
    ...LINA_CLOSING_CHOICES.map((c) => c.id),
    ...EXPECTATION_CHOICES.map((c) => c.id),
    ...RETRY_CHOICES.map((c) => c.id),
    ...gapChoices,
  ]);
  return {
    solutions: Object.fromEntries(SOLUTION_CARDS.map((c) => [c.id, c.cost])),
    maxCost: SOLUTION_BUDGET,
    cards: INVESTIGATION_CARDS.map((c) => c.id),
    evidenceIds: [...EVIDENCE_IDS],
    icons: [...ANNOUNCE_ICONS],
    reportItemIds: [
      ...INVESTIGATION_CARDS.map((c) => c.id),
      ...ANNOUNCE_NPC_IDS.map((id) => `finding-${id}`),
    ],
    choiceIds: [...choiceIds].sort(),
    minigames: Object.fromEntries(MINIGAMES.map((m) => [m.id, [...m.decisions]])),
    decisionSteps: Object.fromEntries(
      Object.entries(DECISION_STEPS).map(([context, steps]) => [context, [...steps]]),
    ),
  };
}
