import { waterCrisisScenario as scenario } from '../data/waterCrisisScenario.ts'
import { createInitialSessionState } from '../context/sessionReducer.ts'
import type { SessionEvent, SessionState } from '../types/session.ts'

export const SESSION_STORAGE_KEY = 'denge-kasabasi:session:v1'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isId<T extends string>(value: unknown, ids: readonly T[]): value is T {
  return typeof value === 'string' && ids.some((id) => id === value)
}

function isIdList<T extends string>(value: unknown, ids: readonly T[]): value is T[] {
  return Array.isArray(value) && value.every((id) => isId(id, ids)) && new Set(value).size === value.length
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean'
}

export function parseSessionState(value: unknown): SessionState | null {
  if (!isRecord(value)) return null
  const {
    sessionId, currentScreen, exploredLocations, viewedSources, selectedInterventions,
    selectedReason, confidence, outcomeViewed, newEvidenceViewed,
    reflectionUnexpectedResult, wantsRevision, revisionCount, hintCount, completed,
  } = value

  if (
    !(sessionId === null || (typeof sessionId === 'string' && uuidPattern.test(sessionId))) ||
    !(currentScreen === 1 || currentScreen === 2) ||
    !isIdList(exploredLocations, scenario.locations.map(({ id }) => id)) ||
    !isIdList(viewedSources, scenario.sources.map(({ id }) => id)) ||
    !isIdList(selectedInterventions, scenario.interventions.map(({ id }) => id)) ||
    !(selectedReason === null || isId(selectedReason, scenario.reasons.map(({ id }) => id))) ||
    !(confidence === null || confidence === 1 || confidence === 2 || confidence === 3 || confidence === 4 || confidence === 5) ||
    typeof outcomeViewed !== 'boolean' || typeof newEvidenceViewed !== 'boolean' ||
    !isNullableBoolean(reflectionUnexpectedResult) || !isNullableBoolean(wantsRevision) ||
    !(revisionCount === 0 || revisionCount === 1) ||
    typeof hintCount !== 'number' || !Number.isSafeInteger(hintCount) || hintCount < 0 ||
    typeof completed !== 'boolean' || !Array.isArray(value.events)
  ) return null

  const cost = selectedInterventions.reduce((total, id) =>
    total + (scenario.interventions.find((intervention) => intervention.id === id)?.cost ?? 0), 0)
  if (selectedInterventions.length > scenario.limits.maxInterventions || cost > scenario.initialState.budget) return null

  if (sessionId === null
    ? currentScreen !== 1 || value.events.length !== 0
    : currentScreen !== 2 || value.events.length !== 1
  ) return null

  const events: SessionEvent[] = []
  for (const event of value.events) {
    if (
      !isRecord(event) || event.eventType !== 'session_started' || event.screen !== 'intro' ||
      typeof event.timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.timestamp) ||
      !Number.isFinite(Date.parse(event.timestamp))
    ) return null
    events.push({ eventType: 'session_started', timestamp: event.timestamp, screen: 'intro' })
  }

  return {
    sessionId, currentScreen,
    exploredLocations: [...exploredLocations],
    viewedSources: [...viewedSources],
    selectedInterventions: [...selectedInterventions],
    selectedReason, confidence, outcomeViewed, newEvidenceViewed,
    reflectionUnexpectedResult, wantsRevision, revisionCount, hintCount, completed, events,
  }
}

export function loadSessionState(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    const stored: unknown = raw ? JSON.parse(raw) : null
    if (isRecord(stored) && stored.version === 1) {
      return parseSessionState(stored.state) ?? createInitialSessionState()
    }
  } catch {
    return createInitialSessionState()
  }
  return createInitialSessionState()
}

export function saveSessionState(state: SessionState): boolean {
  const anonymousState = parseSessionState(state)
  if (!anonymousState) return false
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, state: anonymousState }))
    return true
  } catch {
    return false
  }
}

export function resetSession(): SessionState {
  const state = createInitialSessionState()
  saveSessionState(state)
  return state
}
