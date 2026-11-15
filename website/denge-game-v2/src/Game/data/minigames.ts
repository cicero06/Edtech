/**
 * District workshops ported from the Unity build — one per investigation
 * district. Each one finishes with a single `minigame` session event
 * (synced as `minigame_completed`), so the backend never needs a release for
 * a new workshop: adding an entry here + `npm run manifest` is enough.
 *
 * `decisions` lists the final picks a workshop may report; the manifest
 * hands this list to the server, which rejects anything else.
 */
import type { InvestigationId } from './story';

export type MinigameId = 'aylin' | 'nuri' | 'kemal' | 'riza';

export interface MinigameDef {
  id: MinigameId;
  /** The investigation card this workshop replaces. */
  cardId: InvestigationId;
  title: string;
  decisions: readonly string[];
}

export const MINIGAMES: readonly MinigameDef[] = [
  {
    id: 'aylin',
    cardId: 'baraj',
    title: 'Mühendis Aylin’in Atölyesi',
    decisions: ['patch', 'replace', 'sensor'],
  },
  {
    id: 'kemal',
    cardId: 'park',
    title: 'İşçi Kemal’in Akıllı Park Atölyesi',
    // No branching decision: the result is graded via score + metrics.
    decisions: [],
  },
];

/** Result every workshop hands back to App when the student finishes. */
export interface MinigameResult {
  gameId: MinigameId;
  decisionId?: string;
  /** 0–100, optional — not every workshop grades. */
  score?: number;
  /** Small flat map of numbers: litres saved, cost, tries… */
  metrics?: Record<string, number>;
}

export const minigameForCard = (cardId: string): MinigameDef | undefined =>
  MINIGAMES.find((m) => m.cardId === cardId);
