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
}

export const PAYLOAD_SCHEMA_VERSION = 1;

const MAX_SHORT_TEXT = 120;
const MAX_LONG_TEXT = 2000;
const MAX_RATIONALE = 1000;

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
  }
}
