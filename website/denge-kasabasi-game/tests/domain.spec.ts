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

test('Town Map tracks unique locations and observable open events before continuing', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const opened = sessionReducer(started, {
    type: 'openLocation', locationId: 'dam', timestamp: '2026-09-10T12:01:00.000Z',
  })
  const reopened = sessionReducer(opened, {
    type: 'openLocation', locationId: 'dam', timestamp: '2026-09-10T12:02:00.000Z',
  })

  expect(reopened.exploredLocations).toEqual(['dam'])
  expect(reopened.events.filter(({ eventType }) => eventType === 'location_opened')).toHaveLength(2)
  expect(reopened.events.at(-1)).toEqual({
    eventType: 'location_opened', timestamp: '2026-09-10T12:02:00.000Z', screen: 'town-map', target: 'dam',
  })
  expect(sessionReducer(reopened, { type: 'continueToResearch' }).currentScreen).toBe(3)
  expect(sessionReducer(createInitialSessionState(), {
    type: 'openLocation', locationId: 'dam', timestamp: '2026-09-10T12:01:00.000Z',
  })).toEqual(createInitialSessionState())
})

test('Research tracks unique sources, hint request and progression', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const research = sessionReducer(started, { type: 'continueToResearch' })
  const opened = sessionReducer(research, {
    type: 'openSource', sourceId: 'farmer', timestamp: '2026-09-10T12:02:00.000Z',
  })
  const reopened = sessionReducer(opened, {
    type: 'openSource', sourceId: 'farmer', timestamp: '2026-09-10T12:03:00.000Z',
  })
  const hinted = sessionReducer(reopened, {
    type: 'requestHint', timestamp: '2026-09-10T12:04:00.000Z',
  })

  expect(reopened.viewedSources).toEqual(['farmer'])
  expect(reopened.events.filter(({ eventType }) => eventType === 'source_opened')).toHaveLength(2)
  expect(hinted.hintCount).toBe(1)
  expect(sessionReducer(hinted, {
    type: 'requestHint', timestamp: '2026-09-10T12:05:00.000Z',
  })).toBe(hinted)
  expect(sessionReducer(hinted, { type: 'continueToPlanning' }).currentScreen).toBe(4)
})

test('Planning enforces selection count and budget while logging observable changes', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const research = sessionReducer(started, { type: 'continueToResearch' })
  let state = sessionReducer(research, { type: 'continueToPlanning' })
  state = sessionReducer(state, {
    type: 'viewIntervention', interventionId: 'network-leak-repair', timestamp: '2026-09-10T12:05:00.000Z',
  })
  state = sessionReducer(state, {
    type: 'selectIntervention', interventionId: 'network-leak-repair', timestamp: '2026-09-10T12:06:00.000Z',
  })
  state = sessionReducer(state, {
    type: 'selectIntervention', interventionId: 'rainwater-harvesting', timestamp: '2026-09-10T12:07:00.000Z',
  })
  const overBudget = sessionReducer(state, {
    type: 'selectIntervention', interventionId: 'new-well', timestamp: '2026-09-10T12:08:00.000Z',
  })
  expect(overBudget).toBe(state)
  state = sessionReducer(state, {
    type: 'selectIntervention', interventionId: 'reduce-park-irrigation', timestamp: '2026-09-10T12:09:00.000Z',
  })
  expect(state.selectedInterventions).toEqual([
    'network-leak-repair', 'rainwater-harvesting', 'reduce-park-irrigation',
  ])
  expect(sessionReducer(state, {
    type: 'selectIntervention', interventionId: 'reduce-agricultural-irrigation', timestamp: '2026-09-10T12:10:00.000Z',
  })).toBe(state)

  state = sessionReducer(state, {
    type: 'removeIntervention', interventionId: 'rainwater-harvesting', timestamp: '2026-09-10T12:11:00.000Z',
  })
  expect(state.selectedInterventions).toEqual(['network-leak-repair', 'reduce-park-irrigation'])
  expect(state.events.some(({ eventType }) => eventType === 'intervention_viewed')).toBe(true)
  expect(state.events.some(({ eventType }) => eventType === 'intervention_removed')).toBe(true)
  expect(sessionReducer(state, { type: 'continueToDecision' }).currentScreen).toBe(5)
})

test('Decision records reason, confidence and an immutable submitted plan snapshot', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const research = sessionReducer(started, { type: 'continueToResearch' })
  const planning = sessionReducer(research, { type: 'continueToPlanning' })
  const selected = sessionReducer(planning, {
    type: 'selectIntervention', interventionId: 'new-well', timestamp: '2026-09-10T12:12:00.000Z',
  })
  const decision = sessionReducer(selected, { type: 'continueToDecision' })
  expect(sessionReducer(decision, { type: 'submitPlan', timestamp: '2026-09-10T12:13:00.000Z' })).toBe(decision)
  const reasonSelected = sessionReducer(decision, {
    type: 'selectReason', reasonId: 'other', timestamp: '2026-09-10T12:14:00.000Z',
  })
  const confidenceSet = sessionReducer(reasonSelected, {
    type: 'setConfidence', confidence: 1, timestamp: '2026-09-10T12:15:00.000Z',
  })
  const submitted = sessionReducer(confidenceSet, {
    type: 'submitPlan', timestamp: '2026-09-10T12:16:00.000Z',
  })

  expect(submitted.currentScreen).toBe(6)
  expect(submitted.events.slice(-3)).toEqual([
    { eventType: 'reason_selected', timestamp: '2026-09-10T12:14:00.000Z', screen: 'decision', target: 'other' },
    { eventType: 'confidence_submitted', timestamp: '2026-09-10T12:15:00.000Z', screen: 'decision', value: 1 },
    { eventType: 'plan_submitted', timestamp: '2026-09-10T12:16:00.000Z', screen: 'decision', value: ['new-well'] },
  ])
})

test('Outcome viewing and new evidence events are atomic before Reflection', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const research = sessionReducer(started, { type: 'continueToResearch' })
  const planning = sessionReducer(research, { type: 'continueToPlanning' })
  const selected = sessionReducer(planning, { type: 'selectIntervention', interventionId: 'network-leak-repair', timestamp: '2026-09-10T12:16:00.000Z' })
  const decision = sessionReducer(selected, { type: 'continueToDecision' })
  const reason = sessionReducer(decision, {
    type: 'selectReason', reasonId: 'environment', timestamp: '2026-09-10T12:17:00.000Z',
  })
  const confidence = sessionReducer(reason, {
    type: 'setConfidence', confidence: 3, timestamp: '2026-09-10T12:18:00.000Z',
  })
  const submitted = sessionReducer(confidence, {
    type: 'submitPlan', timestamp: '2026-09-10T12:19:00.000Z',
  })
  const outcome = sessionReducer(submitted, {
    type: 'viewOutcome', timestamp: '2026-09-10T12:20:00.000Z',
  })
  expect(sessionReducer(outcome, {
    type: 'viewOutcome', timestamp: '2026-09-10T12:21:00.000Z',
  })).toBe(outcome)
  const evidence = sessionReducer(outcome, {
    type: 'viewNewEvidence', timestamp: '2026-09-10T12:22:00.000Z',
  })
  expect(sessionReducer(evidence, {
    type: 'viewNewEvidence', timestamp: '2026-09-10T12:23:00.000Z',
  })).toBe(evidence)
  expect(evidence.events.slice(-2)).toEqual([
    { eventType: 'outcome_viewed', timestamp: '2026-09-10T12:20:00.000Z', screen: 'outcome', value: 'first' },
    { eventType: 'new_evidence_viewed', timestamp: '2026-09-10T12:22:00.000Z', screen: 'outcome', target: 'rainfall-forecast' },
  ])
  expect(sessionReducer(evidence, { type: 'continueFromOutcome' }).currentScreen).toBe(7)
})

test('Reflection keeps a plan or allows one observable revision cycle', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const research = sessionReducer(started, { type: 'continueToResearch' })
  let planning = sessionReducer(research, { type: 'continueToPlanning' })
  planning = sessionReducer(planning, {
    type: 'selectIntervention', interventionId: 'rainwater-harvesting', timestamp: '2026-09-10T12:24:00.000Z',
  })
  let decision = sessionReducer(planning, { type: 'continueToDecision' })
  decision = sessionReducer(decision, {
    type: 'selectReason', reasonId: 'environment', timestamp: '2026-09-10T12:25:00.000Z',
  })
  decision = sessionReducer(decision, {
    type: 'setConfidence', confidence: 3, timestamp: '2026-09-10T12:26:00.000Z',
  })
  const submitted = sessionReducer(decision, { type: 'submitPlan', timestamp: '2026-09-10T12:27:00.000Z' })
  const outcome = sessionReducer(submitted, { type: 'viewOutcome', timestamp: '2026-09-10T12:28:00.000Z' })
  const evidence = sessionReducer(outcome, { type: 'viewNewEvidence', timestamp: '2026-09-10T12:29:00.000Z' })
  const reflection = sessionReducer(evidence, { type: 'continueFromOutcome' })

  const keepUnexpected = sessionReducer(reflection, { type: 'setUnexpectedResult', value: false })
  const keepChoice = sessionReducer(keepUnexpected, { type: 'setWantsRevision', value: false })
  const kept = sessionReducer(keepChoice, { type: 'submitReflection', timestamp: '2026-09-10T12:30:00.000Z' })
  expect(kept.currentScreen).toBe(8)
  expect(kept.revisionCount).toBe(0)
  const completed = sessionReducer(kept, {
    type: 'completeSession', timestamp: '2026-09-10T12:30:30.000Z',
  })
  expect(completed.completed).toBe(true)
  expect(sessionReducer(completed, {
    type: 'completeSession', timestamp: '2026-09-10T12:30:31.000Z',
  })).toBe(completed)

  const reviseUnexpected = sessionReducer(reflection, { type: 'setUnexpectedResult', value: true })
  const reviseChoice = sessionReducer(reviseUnexpected, { type: 'setWantsRevision', value: true })
  let revised = sessionReducer(reviseChoice, { type: 'submitReflection', timestamp: '2026-09-10T12:31:00.000Z' })
  expect(revised.currentScreen).toBe(4)
  expect(revised.revisionCount).toBe(1)
  revised = sessionReducer(revised, {
    type: 'removeIntervention', interventionId: 'rainwater-harvesting', timestamp: '2026-09-10T12:32:00.000Z',
  })
  revised = sessionReducer(revised, {
    type: 'selectIntervention', interventionId: 'new-well', timestamp: '2026-09-10T12:33:00.000Z',
  })
  const revisedDecision = sessionReducer(revised, { type: 'continueToDecision' })
  const revisedSubmitted = sessionReducer(revisedDecision, {
    type: 'submitPlan', timestamp: '2026-09-10T12:34:00.000Z',
  })
  expect(revisedSubmitted.events.at(-1)).toEqual({
    eventType: 'plan_revised', timestamp: '2026-09-10T12:34:00.000Z', screen: 'decision', value: ['new-well'],
  })
  const finalOutcome = sessionReducer(revisedSubmitted, {
    type: 'viewOutcome', timestamp: '2026-09-10T12:35:00.000Z',
  })
  expect(finalOutcome.events.at(-1)?.value).toBe('final')
  expect(sessionReducer(finalOutcome, { type: 'continueFromOutcome' }).currentScreen).toBe(8)
})

test('persistence parser round-trips all approved anonymous fields', () => {
  const started = sessionReducer(createInitialSessionState(), startAction)
  const locationOpened = sessionReducer(started, {
    type: 'openLocation', locationId: 'dam', timestamp: '2026-09-10T12:01:00.000Z',
  })
  const research = sessionReducer(locationOpened, { type: 'continueToResearch' })
  const sourceOpened = sessionReducer(research, {
    type: 'openSource', sourceId: 'municipality_engineer', timestamp: '2026-09-10T12:02:00.000Z',
  })
  const hintRequested = sessionReducer(sourceOpened, {
    type: 'requestHint', timestamp: '2026-09-10T12:03:00.000Z',
  })
  const planning = sessionReducer(hintRequested, { type: 'continueToPlanning' })
  const selected = sessionReducer(planning, {
    type: 'selectIntervention', interventionId: 'network-leak-repair', timestamp: '2026-09-10T12:04:00.000Z',
  })
  const decision = sessionReducer(selected, { type: 'continueToDecision' })
  const reasonSelected = sessionReducer(decision, {
    type: 'selectReason', reasonId: 'budget-balance', timestamp: '2026-09-10T12:05:00.000Z',
  })
  const confidenceSet = sessionReducer(reasonSelected, {
    type: 'setConfidence', confidence: 4, timestamp: '2026-09-10T12:06:00.000Z',
  })
  const submitted = sessionReducer(confidenceSet, {
    type: 'submitPlan', timestamp: '2026-09-10T12:07:00.000Z',
  })
  const outcomeViewed = sessionReducer(submitted, {
    type: 'viewOutcome', timestamp: '2026-09-10T12:08:00.000Z',
  })
  const evidenceViewed = sessionReducer(outcomeViewed, {
    type: 'viewNewEvidence', timestamp: '2026-09-10T12:09:00.000Z',
  })
  const reflection = sessionReducer(evidenceViewed, { type: 'continueFromOutcome' })
  const unexpectedSet = sessionReducer(reflection, { type: 'setUnexpectedResult', value: true })
  const revisionSet = sessionReducer(unexpectedSet, { type: 'setWantsRevision', value: true })
  const revisedPlanning = sessionReducer(revisionSet, {
    type: 'submitReflection', timestamp: '2026-09-10T12:10:00.000Z',
  })
  const revisedDecision = sessionReducer(revisedPlanning, { type: 'continueToDecision' })
  const revisedSubmitted = sessionReducer(revisedDecision, {
    type: 'submitPlan', timestamp: '2026-09-10T12:11:00.000Z',
  })
  const finalOutcome = sessionReducer(revisedSubmitted, {
    type: 'viewOutcome', timestamp: '2026-09-10T12:12:00.000Z',
  })
  const summary = sessionReducer(finalOutcome, { type: 'continueFromOutcome' })
  const state = sessionReducer(summary, {
    type: 'completeSession', timestamp: '2026-09-10T12:13:00.000Z',
  })
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
