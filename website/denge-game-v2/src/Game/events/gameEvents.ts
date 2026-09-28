/**
 * The single source of truth for every message that crosses the React <-> Phaser
 * boundary. Nothing else in the codebase should contain a raw event-name string.
 */

import type { DistrictId } from '../data/districts';
import type { QuestStage } from '../data/session';

export const GameEvents = {
  /** Phaser -> React: an NPC conversation should be shown. */
  OPEN_DIALOGUE: 'open-dialogue',
  /** React -> Phaser: the dialogue was dismissed without a decision. */
  DIALOGUE_CLOSED: 'dialogue-closed',
  /** React -> Phaser: the player picked a decision option. */
  DIALOGUE_CHOICE: 'dialogue-choice',
  /** Phaser -> React: the player walked into a different district. */
  DISTRICT_CHANGED: 'district-changed',
  /** Phaser -> React: a district investigation card should be shown. */
  OPEN_INVESTIGATION: 'open-investigation',
  /** React -> Phaser: the investigation card was completed/dismissed. */
  INVESTIGATION_COMPLETED: 'investigation-completed',
  /** Phaser -> React: the current objective text changed (null hides it). */
  OBJECTIVE_CHANGED: 'objective-changed',
  /** Phaser -> React: after the report talk, the notebook should open in evidence-marking mode. */
  OPEN_EVIDENCE: 'open-evidence',
  /** React -> Phaser: the player marked confirmed causes in the notebook. */
  EVIDENCE_SUBMITTED: 'evidence-submitted',
  /** Phaser -> React: the mayor opened the solution-package meeting. */
  OPEN_SOLUTION: 'open-solution',
  /** React -> Phaser: the player submitted a solution package within budget. */
  PLAN_SUBMITTED: 'plan-submitted',
  /** React -> Phaser: the speaker toggle changed; Phaser mirrors it to its sound manager. */
  AUDIO_MUTED: 'audio-muted',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

export interface DialogueChoice {
  id: string;
  text: string;
}

export interface DialoguePayload {
  npcId: string;
  name: string;
  text: string;
  /** Optional extra pages read sequentially before the dialogue closes. */
  pages?: string[];
  choices?: DialogueChoice[];
}

export interface InvestigationPayload {
  /** Key into INVESTIGATION_CARDS in data/story.ts. */
  cardId: string;
}

export interface ObjectivePayload {
  /** Current objective text, or null to hide the objective pill. */
  text: string | null;
  /** Quest stage at emit time - lets React persist session progress. */
  stage: QuestStage;
}

export interface DistrictChangedPayload {
  id: DistrictId;
  /** Turkish display name, ready to render. */
  label: string;
}

export interface EvidenceSubmittedPayload {
  /** Investigation ids the player marked as confirmed causes. */
  confirmedIds: string[];
}

export interface PlanSubmittedPayload {
  /** Solution card ids the player picked for the rescue package. */
  solutionIds: string[];
  /** Total cost of the picked solutions, in TL. */
  totalCost: number;
  /** The player's one-line justification - saved for the final report. */
  rationale?: string;
}

export interface AudioMutedPayload {
  muted: boolean;
}

/** Maps each event name to its payload type. `void` means "no payload". */
export interface GameEventPayloads {
  [GameEvents.OPEN_DIALOGUE]: DialoguePayload;
  [GameEvents.DIALOGUE_CLOSED]: void;
  [GameEvents.DIALOGUE_CHOICE]: string;
  [GameEvents.DISTRICT_CHANGED]: DistrictChangedPayload;
  [GameEvents.OPEN_INVESTIGATION]: InvestigationPayload;
  [GameEvents.INVESTIGATION_COMPLETED]: InvestigationPayload;
  [GameEvents.OBJECTIVE_CHANGED]: ObjectivePayload;
  [GameEvents.OPEN_EVIDENCE]: void;
  [GameEvents.EVIDENCE_SUBMITTED]: EvidenceSubmittedPayload;
  [GameEvents.OPEN_SOLUTION]: void;
  [GameEvents.PLAN_SUBMITTED]: PlanSubmittedPayload;
  [GameEvents.AUDIO_MUTED]: AudioMutedPayload;
}
