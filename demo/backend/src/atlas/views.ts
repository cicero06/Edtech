import { decodeJson } from '../firebase/firebase.service.js';
import type { GameAttempt } from '../firebase/models.js';

/**
 * API shape of an attempt, matching the former Prisma include:
 * `state: { state } | null` and `_count: { events }`.
 */
export function attemptView(attempt: GameAttempt) {
  const { state, stateUpdatedAt, eventCount, workspaceId: _w, groupId: _g, ...rest } =
    attempt;
  return {
    ...rest,
    state:
      state === null || state === undefined
        ? null
        : {
            attemptId: attempt.id,
            state: decodeJson(state),
            updatedAt: stateUpdatedAt,
          },
    _count: { events: eventCount ?? 0 },
  };
}
