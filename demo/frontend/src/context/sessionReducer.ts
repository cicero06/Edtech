import type { SessionAction, SessionState } from '../types/session.ts'

export function createInitialSessionState(): SessionState {
  return {
    sessionId: null,
    currentScreen: 1,
    exploredLocations: [],
    viewedSources: [],
    selectedInterventions: [],
    selectedReason: null,
    confidence: null,
    outcomeViewed: false,
    newEvidenceViewed: false,
    reflectionUnexpectedResult: null,
    wantsRevision: null,
    revisionCount: 0,
    hintCount: 0,
    completed: false,
    events: [],
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      if (state.sessionId !== null || state.currentScreen !== 1) return state
      return {
        ...state,
        sessionId: action.sessionId,
        currentScreen: 2,
        events: [{ eventType: 'session_started', timestamp: action.timestamp, screen: 'intro' }],
      }
    case 'reset':
      return createInitialSessionState()
  }
}
