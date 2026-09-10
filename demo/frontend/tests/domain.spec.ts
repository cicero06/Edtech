import { expect, test } from '@playwright/test'
import { waterCrisisScenario } from '../src/data/waterCrisisScenario.ts'
import { createInitialSessionState, sessionReducer } from '../src/context/sessionReducer.ts'
import { parseSessionState } from '../src/utils/sessionStorage.ts'

const startAction = {
  type: 'start',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2026-09-10T12:00:00.000Z',
} as const

test('scenario values match the locked specification', () => {
  expect(waterCrisisScenario.id).toBe('water-crisis')
  expect(waterCrisisScenario.initialState).toEqual({ water: 42, budget: 50 })
  expect(waterCrisisScenario.targetAge).toEqual({ min: 10, max: 12 })
  expect(waterCrisisScenario.limits).toEqual({ maxInterventions: 3, maxRevisions: 1 })
  expect(waterCrisisScenario.interventions.map(({ id, cost, waterDelta }) => [id, cost, waterDelta])).toEqual([
    ['network-leak-repair', 20, 14],
    ['reduce-agricultural-irrigation', 5, 16],
    ['reduce-park-irrigation', 2, 3],
    ['rainwater-harvesting', 25, 5],
    ['new-well', 15, 12],
  ])
  expect(waterCrisisScenario.interventions[3].revisedWaterDelta).toBe(3)
  expect(waterCrisisScenario.locations).toHaveLength(5)
  expect(waterCrisisScenario.sources).toHaveLength(6)
  expect(waterCrisisScenario.reasons).toHaveLength(5)
  expect(waterCrisisScenario.waterUseDistribution.map(({ percentage }) => percentage)).toEqual([34, 40, 8, 18])
})

test('start is atomic and repeated dispatch does not duplicate the event', () => {
  const initial = createInitialSessionState()
  expect(initial.sessionId).toBeNull()
  expect(initial.events).toEqual([])
  const started = sessionReducer(initial, startAction)
  expect(started.currentScreen).toBe(2)
  expect(started.sessionId).toBe(startAction.sessionId)
  expect(started.events).toEqual([
    { eventType: 'session_started', timestamp: startAction.timestamp, screen: 'intro' },
  ])
  expect(sessionReducer(started, { ...startAction, sessionId: 'another-id' })).toBe(started)
  expect(initial.currentScreen).toBe(1)
  expect(initial.events).toEqual([])
})

test('reset returns fresh anonymous state without old events', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  expect(sessionReducer(started, { type: 'reset' })).toEqual(createInitialSessionState())
})

test('persistence parser round-trips all approved anonymous fields', () => {
  const state = {
    ...sessionReducer(createInitialSessionState(), startAction),
    exploredLocations: ['dam'],
    viewedSources: ['municipality_engineer'],
    selectedInterventions: ['network-leak-repair'],
    selectedReason: 'budget-balance',
    confidence: 4,
    outcomeViewed: true,
    newEvidenceViewed: true,
    reflectionUnexpectedResult: true,
    wantsRevision: true,
    revisionCount: 1,
    hintCount: 1,
    completed: true,
  }
  expect(parseSessionState(state)).toEqual(state)
})

test('persistence drops extra properties and event metadata rather than retaining personal data', () => {
  const state = sessionReducer(createInitialSessionState(), startAction)
  const restored = parseSessionState({
    ...state,
    name: 'unapproved-field',
    profile: { email: 'unapproved-field' },
    events: [{ ...state.events[0], metadata: { name: 'unapproved-field' } }],
  })
  expect(restored).toEqual(state)
})

test('invalid stored state cannot bypass approved bounds or break navigation', () => {
  const state = sessionReducer(createInitialSessionState(), startAction)
  for (const patch of [
    { currentScreen: 99 },
    { sessionId: 'not-a-uuid' },
    { revisionCount: 2 },
    { confidence: 6 },
    { selectedInterventions: ['network-leak-repair', 'rainwater-harvesting', 'new-well'] },
    { selectedReason: 'arbitrary free text' },
    { exploredLocations: ['unknown'] },
    { events: [{ eventType: 'belief_revised', timestamp: startAction.timestamp, screen: 'intro' }] },
  ]) {
    expect(parseSessionState({ ...state, ...patch })).toBeNull()
  }
  expect(parseSessionState(null)).toBeNull()
})
