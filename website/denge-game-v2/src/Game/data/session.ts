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
  | 'lina-intro'
  | 'meet-mayor'
  | 'investigate'
  | 'report'
  | 'meeting'
  | 'done';

export interface PlayerProfile {
  name: string;
  avatar: TextureKey;
}

export interface NotebookEntry {
  cardId: InvestigationId;
  icon: string;
  text: string;
  datum?: string;
}

export interface SubmittedPlan {
  solutionIds: string[];
  totalCost: number;
}

export interface GameSession {
  player: PlayerProfile;
  quest: QuestStage;
  completedCards: InvestigationId[];
  notebook: NotebookEntry[];
  evidence: string[];
  plan: SubmittedPlan | null;
  stats: GameStats;
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

const STORAGE_KEY = 'denge-kasabasi-session-v1';

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
    stats: { ...INITIAL_STATS },
    savedAt: Date.now(),
  };
}
