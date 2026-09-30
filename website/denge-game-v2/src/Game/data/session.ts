/**
 * Mock session store - the seam where a real backend will plug in later.
 *
 * Everything a future student account needs already lives here: the profile,
 * quest progress, notebook, marked evidence, submitted plan and stats. Today
 * it persists to localStorage; when a database arrives, only these functions
 * change - the UI and the scene won't notice.
 */

import { TextureKeys, type TextureKey } from './assets';
import { INITIAL_STATS, type GameStats } from './stats';
import type { InvestigationId } from './story';

/** Mirrors the stage machine inside GameScene. */
export type QuestStage =
  // chapter 1 - understand the problem, decide a plan, tell the town
  | 'lina-intro'
  | 'meet-mayor'
  | 'investigate'
  | 'report'
  | 'meeting'
  | 'announce'
  // chapter 2 - the plan meets reality: 30 days, findings, second chance
  | 'expectation'
  | 'implement'
  | 'revisit'
  | 'debrief'
  | 'retry'
  | 'finale'
  | 'done';

export interface PlayerProfile {
  name: string;
  avatar: TextureKey;
}

export interface NotebookEntry {
  /** Investigation id for chapter-1 hints, `finding-*` ids for chapter-2 observations. */
  cardId: string;
  icon: string;
  text: string;
  datum?: string;
  /** `'finding'` marks a chapter-2 review observation (selectable in the town report). */
  kind?: 'finding';
}

export interface SubmittedPlan {
  solutionIds: string[];
  totalCost: number;
  /** The student's own justification for the package. */
  rationale?: string;
}

export interface GameSession {
  player: PlayerProfile;
  quest: QuestStage;
  completedCards: InvestigationId[];
  notebook: NotebookEntry[];
  evidence: string[];
  plan: SubmittedPlan | null;
  /** Announce round: residents already told about the plan. */
  announcedNpcIds: string[];
  /** Announce round: the plan poster was hung on the civic notice board. */
  posterHung: boolean;
  /** The public announcement the player composed for the town. */
  announcement?: { icon: string; headline: string; message: string };
  // ---- chapter 2 ------------------------------------------------------------
  /** The player's prediction, picked right after the announcement. */
  expectation?: string;
  /** Implementation timeline stop reached: 0 start, 1 mid-month, 2 day 30. */
  implPhase?: number;
  /** Residents whose post-implementation review talk was heard. */
  reviewedNpcIds?: string[];
  /** Stats snapshot taken right before the first plan was submitted. */
  baseStats?: GameStats;
  /** Stats right after plan 1 was applied - the "first run" result. */
  planStats?: GameStats;
  /** The debrief report: findings grouped by what worked vs. what still hurts. */
  report?: { workedIds: string[]; problemIds: string[] };
  /** The second-chance package, if the player tried an alternative. */
  altPlan?: SubmittedPlan | null;
  /** Stats after the alternative plan - the "second run" result. */
  altStats?: GameStats;
  /** The closing "Bugün karar versem…" sentence. */
  finalStatement?: string;
  stats: GameStats;
  /** Speaker toggle - remembered across sessions. */
  muted: boolean;
  savedAt: number;
}

/** Avatar picker options - the front frame of each existing character strip. */
export const AVATARS: readonly TextureKey[] = [
  TextureKeys.PLAYER,
  TextureKeys.LINA,
  TextureKeys.WOMAN,
  TextureKeys.ELIF_TEYZE,
  TextureKeys.ENGINEER_AYLIN,
  TextureKeys.FARMER_RIZA,
  TextureKeys.NURI_AMCA,
  TextureKeys.WORKER_KEMAL,
] as const;

const STORAGE_KEY = 'denge-kasabasi-session-v2';

export function loadSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: GameSession): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, savedAt: Date.now() }),
    );
  } catch {
    // Storage full or private mode - the game still works, it just won't resume.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function newSession(player: PlayerProfile): GameSession {
  return {
    player,
    quest: 'lina-intro',
    completedCards: [],
    notebook: [],
    evidence: [],
    plan: null,
    announcedNpcIds: [],
    posterHung: false,
    stats: { ...INITIAL_STATS },
    muted: false,
    savedAt: Date.now(),
  };
}
