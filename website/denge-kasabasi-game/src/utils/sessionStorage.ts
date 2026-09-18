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
    !(currentScreen === 1 || currentScreen === 2 || currentScreen === 3 || currentScreen === 4 ||
      currentScreen === 5 || currentScreen === 6 || currentScreen === 7 || currentScreen === 8) ||
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
    : currentScreen === 1 || value.events.length < 1
  ) return null

  const locationIds = scenario.locations.map(({ id }) => id)
  const sourceIds = scenario.sources.map(({ id }) => id)
  const interventionIds = scenario.interventions.map(({ id }) => id)
  const reasonIds = scenario.reasons.map(({ id }) => id)
  const events: SessionEvent[] = []
  for (const [index, event] of value.events.entries()) {
    if (
      !isRecord(event) || typeof event.timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.timestamp) ||
      !Number.isFinite(Date.parse(event.timestamp))
    ) return null

    if (index === 0 && event.eventType === 'session_started' && event.screen === 'intro') {
      events.push({ eventType: 'session_started', timestamp: event.timestamp, screen: 'intro' })
    } else if (index > 0 && event.eventType === 'location_opened' && event.screen === 'town-map' &&
      isId(event.target, locationIds)) {
      events.push({
        eventType: 'location_opened', timestamp: event.timestamp, screen: 'town-map', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'source_opened' && event.screen === 'research' &&
      isId(event.target, sourceIds)) {
      events.push({
        eventType: 'source_opened', timestamp: event.timestamp, screen: 'research', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'hint_requested' && event.screen === 'research') {
      events.push({ eventType: 'hint_requested', timestamp: event.timestamp, screen: 'research' })
    } else if (index > 0 && event.eventType === 'intervention_viewed' && event.screen === 'planning' &&
      isId(event.target, interventionIds)) {
      events.push({
        eventType: 'intervention_viewed', timestamp: event.timestamp, screen: 'planning', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'intervention_selected' && event.screen === 'planning' &&
      isId(event.target, interventionIds)) {
      events.push({
        eventType: 'intervention_selected', timestamp: event.timestamp, screen: 'planning', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'intervention_removed' && event.screen === 'planning' &&
      isId(event.target, interventionIds)) {
      events.push({
        eventType: 'intervention_removed', timestamp: event.timestamp, screen: 'planning', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'reason_selected' && event.screen === 'decision' &&
      isId(event.target, reasonIds)) {
      events.push({
        eventType: 'reason_selected', timestamp: event.timestamp, screen: 'decision', target: event.target,
      })
    } else if (index > 0 && event.eventType === 'confidence_submitted' && event.screen === 'decision' &&
      (event.value === 1 || event.value === 2 || event.value === 3 || event.value === 4 || event.value === 5)) {
      events.push({
        eventType: 'confidence_submitted', timestamp: event.timestamp, screen: 'decision', value: event.value,
      })
    } else if (index > 0 && event.eventType === 'plan_submitted' && event.screen === 'decision' &&
      isIdList(event.value, interventionIds)) {
      const submittedCost = event.value.reduce((total, id) =>
        total + (scenario.interventions.find((item) => item.id === id)?.cost ?? 0), 0)
      if (event.value.length > scenario.limits.maxInterventions || submittedCost > scenario.initialState.budget) return null
      events.push({
        eventType: 'plan_submitted', timestamp: event.timestamp, screen: 'decision', value: [...event.value],
      })
    } else if (index > 0 && event.eventType === 'plan_revised' && event.screen === 'decision' &&
      isIdList(event.value, interventionIds)) {
      const revisedCost = event.value.reduce((total, id) =>
        total + (scenario.interventions.find((item) => item.id === id)?.cost ?? 0), 0)
      if (event.value.length > scenario.limits.maxInterventions || revisedCost > scenario.initialState.budget) return null
      events.push({
        eventType: 'plan_revised', timestamp: event.timestamp, screen: 'decision', value: [...event.value],
      })
    } else if (index > 0 && event.eventType === 'outcome_viewed' && event.screen === 'outcome' &&
      (event.value === 'first' || event.value === 'final')) {
      events.push({
        eventType: 'outcome_viewed', timestamp: event.timestamp, screen: 'outcome', value: event.value,
      })
    } else if (index > 0 && event.eventType === 'new_evidence_viewed' && event.screen === 'outcome' &&
      event.target === scenario.newEvidence.id) {
      events.push({
        eventType: 'new_evidence_viewed', timestamp: event.timestamp, screen: 'outcome', target: scenario.newEvidence.id,
      })
    } else if (index > 0 && event.eventType === 'reflection_answered' && event.screen === 'reflection' &&
      isRecord(event.value) && typeof event.value.unexpectedResult === 'boolean' &&
      typeof event.value.wantsRevision === 'boolean') {
      events.push({
        eventType: 'reflection_answered', timestamp: event.timestamp, screen: 'reflection',
        value: { unexpectedResult: event.value.unexpectedResult, wantsRevision: event.value.wantsRevision },
      })
    } else if (index > 0 && event.eventType === 'session_completed' && event.screen === 'session-summary') {
      events.push({ eventType: 'session_completed', timestamp: event.timestamp, screen: 'session-summary' })
    } else {
      return null
    }
  }

  const openedLocations = new Set(events.flatMap((event) =>
    event.eventType === 'location_opened' && event.target ? [event.target] : []))
  const openedSources = new Set(events.flatMap((event) =>
    event.eventType === 'source_opened' && event.target ? [event.target] : []))
  const requestedHints = events.filter((event) => event.eventType === 'hint_requested').length
  const reasonEvents = events.filter((event) => event.eventType === 'reason_selected')
  const confidenceEvents = events.filter((event) => event.eventType === 'confidence_submitted')
  const submittedPlans = events.filter((event) => event.eventType === 'plan_submitted')
  const viewedOutcomes = events.filter((event) => event.eventType === 'outcome_viewed')
  const viewedEvidence = events.filter((event) => event.eventType === 'new_evidence_viewed')
  const revisedPlans = events.filter((event) => event.eventType === 'plan_revised')
  const reflectionEvents = events.filter((event) => event.eventType === 'reflection_answered')
  const completionEvents = events.filter((event) => event.eventType === 'session_completed')
  const lastReflection = reflectionEvents.at(-1)?.value
  const reflectedUnexpected = isRecord(lastReflection) && typeof lastReflection.unexpectedResult === 'boolean'
    ? lastReflection.unexpectedResult : null
  const reflectedRevision = isRecord(lastReflection) && typeof lastReflection.wantsRevision === 'boolean'
    ? lastReflection.wantsRevision : null
  const lastReason = reasonEvents.at(-1)?.target ?? null
  const lastConfidence = confidenceEvents.at(-1)?.value ?? null
  const replayedInterventions = new Set<string>()
  for (const event of events) {
    if (event.eventType === 'intervention_selected' && event.target) {
      if (replayedInterventions.has(event.target)) return null
      replayedInterventions.add(event.target)
      const replayedCost = [...replayedInterventions].reduce((total, id) =>
        total + (scenario.interventions.find((item) => item.id === id)?.cost ?? 0), 0)
      if (replayedInterventions.size > scenario.limits.maxInterventions ||
        replayedCost > scenario.initialState.budget) return null
    } else if (event.eventType === 'intervention_removed' && event.target) {
      if (!replayedInterventions.delete(event.target)) return null
    }
  }
  const firstSubmittedPlan = submittedPlans[0]?.value
  const revisedPlan = revisedPlans[0]?.value
  const revisionIsDifferent = Array.isArray(firstSubmittedPlan) && Array.isArray(revisedPlan) && (
    firstSubmittedPlan.length !== revisedPlan.length ||
    revisedPlan.some((id) => typeof id !== 'string' || !firstSubmittedPlan.includes(id))
  )
  if (
    exploredLocations.some((id) => !openedLocations.has(id)) ||
    [...openedLocations].some((id) => !exploredLocations.includes(id as typeof exploredLocations[number])) ||
    viewedSources.some((id) => !openedSources.has(id)) ||
    [...openedSources].some((id) => !viewedSources.includes(id as typeof viewedSources[number])) ||
    selectedInterventions.some((id) => !replayedInterventions.has(id)) ||
    [...replayedInterventions].some((id) => !selectedInterventions.includes(id as typeof selectedInterventions[number])) ||
    selectedReason !== lastReason || confidence !== lastConfidence ||
    (currentScreen >= 6 && submittedPlans.length < 1) || viewedOutcomes.length > submittedPlans.length ||
    outcomeViewed !== (viewedOutcomes.length > 0) || newEvidenceViewed !== (viewedEvidence.length > 0) ||
    viewedEvidence.length > 1 || (currentScreen >= 7 && viewedOutcomes.length < 1) ||
    reflectionEvents.length > 1 || (reflectionEvents.length > 0 &&
      (reflectionUnexpectedResult !== reflectedUnexpected || wantsRevision !== reflectedRevision)) ||
    (revisionCount === 1 && (reflectedRevision !== true || submittedPlans.length > 2)) ||
    revisedPlans.length > 1 || (revisedPlans.length === 1 &&
      (revisionCount !== 1 || submittedPlans.length !== 2 || !revisionIsDifferent)) ||
    completionEvents.length > 1 || completed !== (completionEvents.length === 1) ||
    (completed && currentScreen !== 8) ||
    hintCount !== requestedHints || hintCount > 1
  ) return null

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
