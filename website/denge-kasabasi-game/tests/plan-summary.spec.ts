import { expect, test } from '@playwright/test'
import { summarizePlan } from '../src/utils/planSummary.ts'
import { createInitialSessionState, sessionReducer } from '../src/context/sessionReducer.ts'
import { waterCrisisScenario } from '../src/data/waterCrisisScenario.ts'

test('summary deduplicates, preserves risks and uses revised rainwater estimate', () => {
  const plan = summarizePlan(['reduce-agricultural-irrigation', 'new-well', 'rainwater-harvesting', 'new-well'])
  expect(plan.selected).toHaveLength(3)
  expect(plan.usedBudget).toBe(45)
  expect(plan.waterDelta).toBe(33)
  expect(plan.agricultureRisk).toBe(true)
  expect(plan.environmentalUncertainty).toBe(true)
  expect(plan.longTermBenefit).toBe(true)
  expect(summarizePlan(['rainwater-harvesting'], 1).waterDelta).toBe(3)
  expect(summarizePlan(['reduce-park-irrigation', 'new-well']).environment).toBe('Orta risk · Uzun vadede belirsizlik var')
  expect(summarizePlan([]).waterDelta).toBe(0)
})

test('reducer rejects empty decisions, duplicate selections and over-budget additions', () => {
  let state = sessionReducer(createInitialSessionState(), { type: 'start', sessionId: 'a', timestamp: '2026-09-18T12:00:00.000Z' })
  state = sessionReducer(state, { type: 'continueToResearch' })
  state = sessionReducer(state, { type: 'continueToPlanning' })
  expect(sessionReducer(state, { type: 'continueToDecision' })).toBe(state)
  const select = (id: typeof waterCrisisScenario.interventions[number]['id']) => ({ type: 'selectIntervention' as const, interventionId: id, timestamp: '2026-09-18T12:01:00.000Z' })
  state = sessionReducer(state, select('network-leak-repair'))
  expect(sessionReducer(state, select('network-leak-repair'))).toBe(state)
  state = sessionReducer(state, select('rainwater-harvesting'))
  expect(sessionReducer(state, select('new-well'))).toBe(state)
  state = sessionReducer(state, select('reduce-agricultural-irrigation'))
  expect(summarizePlan(state.selectedInterventions).remainingBudget).toBe(0)
  expect(sessionReducer(state, select('reduce-park-irrigation'))).toBe(state)
  expect(sessionReducer(state, { type: 'continueToDecision' }).currentScreen).toBe(5)
})
