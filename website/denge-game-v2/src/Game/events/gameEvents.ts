/**
 * The single source of truth for every message that crosses the React <-> Phaser
 * boundary. Nothing else in the codebase should contain a raw event-name string.
 */

import type { DistrictId } from '../data/districts';
import type { QuestStage } from '../data/session';
import type { ChartSeries } from '../data/story';

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
  /** Phaser -> React: a chapter-2 observation landed in the notebook. */
  FINDING_ADDED: 'finding-added',
  /** Phaser -> React: the implementation timeline jumped to a new day stop. */
  DAY_CHANGED: 'day-changed',
  /** Phaser -> React: the notebook should open so the player picks findings for the town report. */
  OPEN_REPORT: 'open-report',
  /** React -> Phaser: the player picked which findings go into the report. */
  REPORT_SUBMITTED: 'report-submitted',
  /** Phaser -> React: the final comparison / statement card should be shown. */
  OPEN_FINALE: 'open-finale',
  /** React -> Phaser: the player wrote the closing statement. */
  FINALE_SUBMITTED: 'finale-submitted',
  /** React -> Phaser: the mini-map/HUD button wants the whole-town overview. */
  MAP_TOGGLED: 'map-toggled',
  /** Phaser -> React: the camera entered/left the whole-town overview. */
  OVERVIEW_CHANGED: 'overview-changed',
  /** Phaser -> React: the player's world position, throttled for the mini-map. */
  PLAYER_MOVED: 'player-moved',
  /** Phaser -> React: the set of points the mini-map should draw. */
  MARKERS_CHANGED: 'markers-changed',
  /** Phaser -> React: the notice board wants the public-announcement composer. */
  OPEN_ANNOUNCE: 'open-announce',
  /** React -> Phaser: the player posted the town announcement. */
  ANNOUNCE_SUBMITTED: 'announce-submitted',
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
  voiceFiles?: readonly (string | null)[];
  choices?: DialogueChoice[];
  /** Optional chart rendered inside the dialogue card (e.g. Aylin's day-30 readout). */
  chart?: ChartSeries;
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

/** Which meeting the solution panel is serving: the first vote or the retry. */
export type SolutionPanelMode = 'initial' | 'retry';

export interface OpenSolutionPayload {
  mode: SolutionPanelMode;
}

export interface FindingAddedPayload {
  /** A completed notebook entry the scene assembled after a review talk. */
  entry: { cardId: string; icon: string; text: string; datum?: string; kind?: 'finding' };
}

export interface DayChangedPayload {
  /** Short banner text, e.g. '15. gün — Ayın ortası'. */
  label: string;
  /** Calendar date shown while the page tears, e.g. '17 Nisan'. */
  date: string;
  /** Clock time shown while the hands spin, e.g. '12:30'. */
  time: string;
  /** forward = time passes; back = retry rewinds; restore = session resume (no animation). */
  direction: 'forward' | 'back' | 'restore';
  /** World tint (CSS rgba) for that time of day. */
  tint: string;
}

export interface ReportSubmittedPayload {
  /** Findings the player classified as "what worked". */
  workedIds: string[];
  /** Findings the player classified as "still a problem". */
  problemIds: string[];
}

export interface FinaleSubmittedPayload {
  /** The player's closing "Bugün karar versem…" sentence. */
  statement: string;
}

export interface OverviewChangedPayload {
  /** true = the camera shows the whole town; false = it follows the player. */
  active: boolean;
}

export interface PlayerMovedPayload {
  x: number;
  y: number;
}

/** A pin on the mini-map: quest "!", implementation site, or twist warning. */
export interface MinimapMarker {
  x: number;
  y: number;
  kind: 'quest' | 'impl' | 'warning';
}

export interface MarkersChangedPayload {
  markers: MinimapMarker[];
}

export interface AnnounceSubmittedPayload {
  /** Picked post visual. */
  icon: string;
  /** Headline text the player approved. */
  headline: string;
  /** The 140-char message the player wrote. */
  message: string;
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
  [GameEvents.OPEN_SOLUTION]: OpenSolutionPayload;
  [GameEvents.PLAN_SUBMITTED]: PlanSubmittedPayload;
  [GameEvents.AUDIO_MUTED]: AudioMutedPayload;
  [GameEvents.FINDING_ADDED]: FindingAddedPayload;
  [GameEvents.DAY_CHANGED]: DayChangedPayload;
  [GameEvents.OPEN_REPORT]: void;
  [GameEvents.REPORT_SUBMITTED]: ReportSubmittedPayload;
  [GameEvents.OPEN_FINALE]: void;
  [GameEvents.FINALE_SUBMITTED]: FinaleSubmittedPayload;
  [GameEvents.MAP_TOGGLED]: void;
  [GameEvents.OVERVIEW_CHANGED]: OverviewChangedPayload;
  [GameEvents.PLAYER_MOVED]: PlayerMovedPayload;
  [GameEvents.MARKERS_CHANGED]: MarkersChangedPayload;
  [GameEvents.OPEN_ANNOUNCE]: void;
  [GameEvents.ANNOUNCE_SUBMITTED]: AnnounceSubmittedPayload;
}
