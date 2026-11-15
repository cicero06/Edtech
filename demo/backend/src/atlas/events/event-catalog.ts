/**
 * Learning-event catalog v1 — see
 * bilgi-belge-dokumanlar/mimari/veri-modeli-ve-erisim-tasarimi.md §4.
 *
 * Payloads are validated against an allowlist of keys plus optional
 * constraints declared by the attempt's ScenarioVersion manifest. Manifest
 * keys that are absent are not enforced — content-driven validation becomes
 * strict once the manifest is generated from story data at build time.
 */

export const EVENT_TYPES = [
  'attempt_started',
  'choice_made',
  'investigation_completed',
  'evidence_submitted',
  'plan_submitted',
  'announcement_submitted',
  'report_classified',
  'alt_plan_submitted',
  'finale_submitted',
  'minigame_completed',
  'decision_step',
  'attempt_completed',
] as const;

export type LearningEventType = (typeof EVENT_TYPES)[number];

export interface ScenarioManifest {
  solutions?: Record<string, number>;
  maxCost?: number;
  cards?: string[];
  evidenceIds?: string[];
  icons?: string[];
  reportItemIds?: string[];
  choiceIds?: string[];
  /** Mini-game id -> the decision ids it may report (empty: no decision). */
  minigames?: Record<string, string[]>;
  /** Decision-trace context id -> the step ids it may report. */
  decisionSteps?: Record<string, string[]>;
}

export const PAYLOAD_SCHEMA_VERSION = 1;

const MAX_SHORT_TEXT = 120;
const MAX_LONG_TEXT = 2000;
const MAX_RATIONALE = 1000;
const MAX_METRICS = 16;
const MAX_DECISION_VALUE = 120;
/** One step can't plausibly take longer than a day; guards against garbage. */
const MAX_STEP_MS = 86_400_000;

type Payload = Record<string, unknown>;

function isPlainObject(value: unknown): value is Payload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function allowedKeys(payload: Payload, keys: string[]): string | null {
  const extra = Object.keys(payload).filter((key) => !keys.includes(key));
  return extra.length ? `Unexpected payload keys: ${extra.join(', ')}` : null;
}

function requireString(
  payload: Payload,
  key: string,
  maxLength: number,
): string | null {
  const value = payload[key];
  if (typeof value !== 'string' || !value.trim()) return `${key} is required`;
  if (value.length > maxLength) return `${key} exceeds ${maxLength} characters`;
  return null;
}

function optionalString(
  payload: Payload,
  key: string,
  maxLength: number,
): string | null {
  const value = payload[key];
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    return `${key} must be a string of at most ${maxLength} characters`;
  }
  return null;
}

function requireIdList(
  payload: Payload,
  key: string,
  options: { allowEmpty?: boolean } = {},
): string[] | string {
  const value = payload[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string' || !entry)
  ) {
    return `${key} must be an array of ids`;
  }
  if (!options.allowEmpty && value.length === 0) return `${key} is empty`;
  if (new Set(value).size !== value.length) return `${key} has duplicates`;
  return value as string[];
}

function inManifest(ids: string[], allowed: string[] | undefined, key: string) {
  if (allowed === undefined) return null;
  const unknown = ids.filter((id) => !allowed.includes(id));
  return unknown.length
    ? `${key} contains ids outside the scenario: ${unknown.join(', ')}`
    : null;
}

function validatePlan(payload: Payload, manifest: ScenarioManifest) {
  const keys = allowedKeys(payload, ['solutionIds', 'totalCost', 'rationale']);
  if (keys) return keys;
  const ids = requireIdList(payload, 'solutionIds');
  if (typeof ids === 'string') return ids;
  const manifestCheck = inManifest(
    ids,
    manifest.solutions ? Object.keys(manifest.solutions) : undefined,
    'solutionIds',
  );
  if (manifestCheck) return manifestCheck;
  const rationale = optionalString(payload, 'rationale', MAX_RATIONALE);
  if (rationale) return rationale;
  if (payload.totalCost !== undefined) {
    if (
      typeof payload.totalCost !== 'number' ||
      !Number.isFinite(payload.totalCost) ||
      payload.totalCost < 0
    ) {
      return 'totalCost must be a non-negative number';
    }
    if (manifest.solutions) {
      const computed = ids.reduce(
        (total, id) => total + (manifest.solutions?.[id] ?? 0),
        0,
      );
      if (computed !== payload.totalCost) {
        return 'totalCost does not match the scenario costs';
      }
    }
  }
  if (manifest.maxCost !== undefined && manifest.solutions) {
    const computed = ids.reduce(
      (total, id) => total + (manifest.solutions?.[id] ?? 0),
      0,
    );
    if (computed > manifest.maxCost) return 'Plan exceeds the scenario budget';
  }
  return null;
}

/**
 * A district workshop (Aylin, Nuri, Kemal, Rıza…). One generic event so a new
 * mini-game needs a manifest entry, not a backend release: `gameId` names the
 * game, `decisionId` the final pick, `score` 0–100 and `metrics` a small flat
 * map of numbers (litres saved, cost, attempts…).
 */
function validateMinigame(payload: Payload, manifest: ScenarioManifest) {
  const keys = allowedKeys(payload, ['gameId', 'decisionId', 'score', 'metrics']);
  if (keys) return keys;
  const game = requireString(payload, 'gameId', 60);
  if (game) return game;
  const gameId = payload.gameId as string;
  const games = manifest.minigames;
  if (games && !Object.hasOwn(games, gameId)) {
    return `gameId outside the scenario: ${gameId}`;
  }
  const decision = optionalString(payload, 'decisionId', 60);
  if (decision) return decision;
  if (payload.decisionId !== undefined && games) {
    const decisionCheck = inManifest(
      [payload.decisionId as string],
      games[gameId],
      'decisionId',
    );
    if (decisionCheck) return decisionCheck;
  }
  if (payload.score !== undefined) {
    const { score } = payload;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100) {
      return 'score must be a number between 0 and 100';
    }
  }
  if (payload.metrics !== undefined) {
    const { metrics } = payload;
    if (!isPlainObject(metrics)) return 'metrics must be an object';
    const entries = Object.entries(metrics);
    if (entries.length > MAX_METRICS) return `metrics has more than ${MAX_METRICS} keys`;
    for (const [key, value] of entries) {
      if (key.length > 40) return 'metrics key too long';
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `metrics.${key} must be a finite number`;
      }
    }
  }
  return null;
}

/**
 * One beat of a student's decision process (decision trace): which context
 * (`kadim`, later `plan`, workshops…), which step (`piece_placed`,
 * `hint_used`, `confidence_given`…), an optional short value and how long the
 * step took. Contexts/steps are enforced only when the attempt's manifest
 * declares `decisionSteps`, so activities created before this event existed
 * keep syncing.
 */
function validateDecisionStep(payload: Payload, manifest: ScenarioManifest) {
  const keys = allowedKeys(payload, ['context', 'step', 'value', 'ms']);
  if (keys) return keys;
  const context = requireString(payload, 'context', 60);
  if (context) return context;
  const step = requireString(payload, 'step', 60);
  if (step) return step;
  const steps = manifest.decisionSteps;
  if (steps) {
    const contextId = payload.context as string;
    if (!Object.hasOwn(steps, contextId)) {
      return `context outside the scenario: ${contextId}`;
    }
    const stepCheck = inManifest([payload.step as string], steps[contextId], 'step');
    if (stepCheck) return stepCheck;
  }
  const { value, ms } = payload;
  if (value !== undefined) {
    const okString = typeof value === 'string' && value.length <= MAX_DECISION_VALUE;
    const okNumber = typeof value === 'number' && Number.isFinite(value);
    if (!okString && !okNumber) {
      return `value must be a number or a string of at most ${MAX_DECISION_VALUE} characters`;
    }
  }
  if (ms !== undefined) {
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0 || ms > MAX_STEP_MS) {
      return 'ms must be a duration in milliseconds';
    }
  }
  return null;
}

/**
 * Returns `null` when the payload conforms, otherwise a human-readable
 * rejection reason. Unknown keys are always rejected.
 */
export function validateEventPayload(
  type: LearningEventType,
  payload: unknown,
  manifest: ScenarioManifest,
): string | null {
  if (!isPlainObject(payload)) return 'Payload must be an object';
  switch (type) {
    case 'attempt_started':
    case 'attempt_completed':
      return allowedKeys(payload, ['clientTime']) ??
        optionalString(payload, 'clientTime', 64);
    case 'choice_made': {
      const keys = allowedKeys(payload, ['choiceId', 'dialogueId']);
      if (keys) return keys;
      const choice = requireString(payload, 'choiceId', 120);
      if (choice) return choice;
      const dialogue = optionalString(payload, 'dialogueId', 120);
      if (dialogue) return dialogue;
      return inManifest([payload.choiceId as string], manifest.choiceIds, 'choiceId');
    }
    case 'investigation_completed': {
      const keys = allowedKeys(payload, ['cardId']);
      if (keys) return keys;
      const card = requireString(payload, 'cardId', 120);
      if (card) return card;
      return inManifest([payload.cardId as string], manifest.cards, 'cardId');
    }
    case 'evidence_submitted': {
      const keys = allowedKeys(payload, ['confirmedIds']);
      if (keys) return keys;
      const ids = requireIdList(payload, 'confirmedIds');
      if (typeof ids === 'string') return ids;
      return inManifest(ids, manifest.evidenceIds, 'confirmedIds');
    }
    case 'plan_submitted':
    case 'alt_plan_submitted':
      return validatePlan(payload, manifest);
    case 'announcement_submitted': {
      const keys = allowedKeys(payload, ['icon', 'headline', 'message']);
      if (keys) return keys;
      const icon = requireString(payload, 'icon', 60);
      if (icon) return icon;
      const iconCheck = inManifest(
        [payload.icon as string],
        manifest.icons,
        'icon',
      );
      if (iconCheck) return iconCheck;
      return requireString(payload, 'headline', MAX_SHORT_TEXT) ??
        requireString(payload, 'message', MAX_LONG_TEXT);
    }
    case 'report_classified': {
      const keys = allowedKeys(payload, ['workedIds', 'problemIds']);
      if (keys) return keys;
      const worked = requireIdList(payload, 'workedIds', { allowEmpty: true });
      if (typeof worked === 'string') return worked;
      const problem = requireIdList(payload, 'problemIds', {
        allowEmpty: true,
      });
      if (typeof problem === 'string') return problem;
      const overlap = worked.filter((id) => problem.includes(id));
      if (overlap.length) return 'workedIds and problemIds overlap';
      return inManifest(
        [...worked, ...problem],
        manifest.reportItemIds,
        'report ids',
      );
    }
    case 'finale_submitted': {
      const keys = allowedKeys(payload, ['statement']);
      if (keys) return keys;
      return requireString(payload, 'statement', MAX_LONG_TEXT);
    }
    case 'minigame_completed':
      return validateMinigame(payload, manifest);
    case 'decision_step':
      return validateDecisionStep(payload, manifest);
  }
}
