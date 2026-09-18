import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
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

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'start': {
      if (state.sessionId !== null || state.currentScreen !== 1) {
        return state
      }

      return {
        ...state,
        sessionId: action.sessionId,
        currentScreen: 2,
        events: [
          {
            eventType: 'session_started',
            timestamp: action.timestamp,
            screen: 'intro',
          },
        ],
      }
    }

    case 'openLocation': {
      if (state.sessionId === null || state.currentScreen !== 2) {
        return state
      }

      const alreadyExplored = state.exploredLocations.includes(
        action.locationId,
      )

      return {
        ...state,

        exploredLocations: alreadyExplored
          ? state.exploredLocations
          : [...state.exploredLocations, action.locationId],

        events: [
          ...state.events,
          {
            eventType: 'location_opened',
            timestamp: action.timestamp,
            screen: 'town-map',
            target: action.locationId,
          },
        ],
      }
    }

    case 'continueToResearch': {
      if (state.sessionId === null || state.currentScreen !== 2) {
        return state
      }

      return {
        ...state,
        currentScreen: 3,
      }
    }

    case 'openSource': {
      if (state.sessionId === null || state.currentScreen !== 3) {
        return state
      }

      const alreadyViewed = state.viewedSources.includes(action.sourceId)
      return {
        ...state,
        viewedSources: alreadyViewed ? state.viewedSources : [...state.viewedSources, action.sourceId],
        events: [...state.events, {
          eventType: 'source_opened',
          timestamp: action.timestamp,
          screen: 'research',
          target: action.sourceId,
        }],
      }
    }

    case 'requestHint': {
      if (state.sessionId === null || state.currentScreen !== 3 || state.hintCount > 0) {
        return state
      }

      return {
        ...state,
        hintCount: 1,
        events: [...state.events, {
          eventType: 'hint_requested',
          timestamp: action.timestamp,
          screen: 'research',
        }],
      }
    }

    case 'continueToPlanning': {
      if (state.sessionId === null || state.currentScreen !== 3) {
        return state
      }

      return {
        ...state,
        currentScreen: 4,
      }
    }

    case 'viewIntervention': {
      if (state.sessionId === null || state.currentScreen !== 4) {
        return state
      }

      return {
        ...state,
        events: [...state.events, {
          eventType: 'intervention_viewed',
          timestamp: action.timestamp,
          screen: 'planning',
          target: action.interventionId,
        }],
      }
    }

    case 'selectIntervention': {
      if (state.sessionId === null || state.currentScreen !== 4 ||
        state.selectedInterventions.includes(action.interventionId)) {
        return state
      }

      const intervention = waterCrisisScenario.interventions.find(({ id }) => id === action.interventionId)
      const usedBudget = state.selectedInterventions.reduce((total, id) =>
        total + (waterCrisisScenario.interventions.find((item) => item.id === id)?.cost ?? 0), 0)
      if (!intervention || state.selectedInterventions.length >= waterCrisisScenario.limits.maxInterventions ||
        usedBudget + intervention.cost > waterCrisisScenario.initialState.budget) {
        return state
      }

      return {
        ...state,
        selectedInterventions: [...state.selectedInterventions, action.interventionId],
        events: [...state.events, {
          eventType: 'intervention_selected',
          timestamp: action.timestamp,
          screen: 'planning',
          target: action.interventionId,
        }],
      }
    }

    case 'removeIntervention': {
      if (state.sessionId === null || state.currentScreen !== 4 ||
        !state.selectedInterventions.includes(action.interventionId)) {
        return state
      }

      return {
        ...state,
        selectedInterventions: state.selectedInterventions.filter((id) => id !== action.interventionId),
        events: [...state.events, {
          eventType: 'intervention_removed',
          timestamp: action.timestamp,
          screen: 'planning',
          target: action.interventionId,
        }],
      }
    }

    case 'continueToDecision': {
      if (state.sessionId === null || state.currentScreen !== 4) {
        return state
      }

      return {
        ...state,
        currentScreen: 5,
      }
    }

    case 'selectReason': {
      if (state.sessionId === null || state.currentScreen !== 5 || state.selectedReason === action.reasonId) {
        return state
      }

      return {
        ...state,
        selectedReason: action.reasonId,
        events: [...state.events, {
          eventType: 'reason_selected',
          timestamp: action.timestamp,
          screen: 'decision',
          target: action.reasonId,
        }],
      }
    }

    case 'setConfidence': {
      if (state.sessionId === null || state.currentScreen !== 5 || state.confidence === action.confidence) {
        return state
      }

      return {
        ...state,
        confidence: action.confidence,
        events: [...state.events, {
          eventType: 'confidence_submitted',
          timestamp: action.timestamp,
          screen: 'decision',
          value: action.confidence,
        }],
      }
    }

    case 'submitPlan': {
      if (state.sessionId === null || state.currentScreen !== 5 ||
        state.selectedReason === null || state.confidence === null) {
        return state
      }

      const submittedEvent = {
        eventType: 'plan_submitted' as const,
        timestamp: action.timestamp,
        screen: 'decision' as const,
        value: [...state.selectedInterventions],
      }
      const firstPlan = state.events.find(({ eventType }) => eventType === 'plan_submitted')?.value
      const firstPlanIds = Array.isArray(firstPlan) ? firstPlan.filter((id): id is string => typeof id === 'string') : []
      const planChanged = state.revisionCount === 1 && (
        firstPlanIds.length !== state.selectedInterventions.length ||
        state.selectedInterventions.some((id) => !firstPlanIds.includes(id))
      )

      return {
        ...state,
        currentScreen: 6,
        events: planChanged
          ? [...state.events, submittedEvent, {
              eventType: 'plan_revised',
              timestamp: action.timestamp,
              screen: 'decision',
              value: [...state.selectedInterventions],
            }]
          : [...state.events, submittedEvent],
      }
    }

    case 'viewOutcome': {
      if (state.sessionId === null || state.currentScreen !== 6) {
        return state
      }

      const submittedPlans = state.events.filter(({ eventType }) => eventType === 'plan_submitted').length
      const viewedOutcomes = state.events.filter(({ eventType }) => eventType === 'outcome_viewed').length
      if (viewedOutcomes >= submittedPlans) {
        return state
      }

      return {
        ...state,
        outcomeViewed: true,
        events: [...state.events, {
          eventType: 'outcome_viewed',
          timestamp: action.timestamp,
          screen: 'outcome',
          value: state.revisionCount === 1 ? 'final' : 'first',
        }],
      }
    }

    case 'viewNewEvidence': {
      if (state.sessionId === null || state.currentScreen !== 6 ||
        state.revisionCount !== 0 || state.newEvidenceViewed) {
        return state
      }

      return {
        ...state,
        newEvidenceViewed: true,
        events: [...state.events, {
          eventType: 'new_evidence_viewed',
          timestamp: action.timestamp,
          screen: 'outcome',
          target: waterCrisisScenario.newEvidence.id,
        }],
      }
    }

    case 'continueFromOutcome': {
      if (state.sessionId === null || state.currentScreen !== 6 ||
        !state.outcomeViewed || (state.revisionCount === 0 && !state.newEvidenceViewed)) {
        return state
      }

      return {
        ...state,
        currentScreen: state.revisionCount === 0 ? 7 : 8,
      }
    }

    case 'setUnexpectedResult': {
      if (state.sessionId === null || state.currentScreen !== 7) {
        return state
      }
      return { ...state, reflectionUnexpectedResult: action.value }
    }

    case 'setWantsRevision': {
      if (state.sessionId === null || state.currentScreen !== 7) {
        return state
      }
      return { ...state, wantsRevision: action.value }
    }

    case 'submitReflection': {
      if (state.sessionId === null || state.currentScreen !== 7 ||
        state.reflectionUnexpectedResult === null || state.wantsRevision === null) {
        return state
      }

      const reflectionEvent = {
        eventType: 'reflection_answered' as const,
        timestamp: action.timestamp,
        screen: 'reflection' as const,
        value: {
          unexpectedResult: state.reflectionUnexpectedResult,
          wantsRevision: state.wantsRevision,
        },
      }
      if (state.wantsRevision && state.revisionCount < waterCrisisScenario.limits.maxRevisions) {
        return {
          ...state,
          currentScreen: 4,
          revisionCount: 1,
          events: [...state.events, reflectionEvent],
        }
      }
      return {
        ...state,
        currentScreen: 8,
        events: [...state.events, reflectionEvent],
      }
    }

    case 'completeSession': {
      if (state.sessionId === null || state.currentScreen !== 8 || state.completed) {
        return state
      }
      return {
        ...state,
        completed: true,
        events: [...state.events, {
          eventType: 'session_completed',
          timestamp: action.timestamp,
          screen: 'session-summary',
        }],
      }
    }

    case 'navigateBack': {
      if (state.sessionId === null) return state
      if (state.currentScreen === 3) return { ...state, currentScreen: 2 }
      if (state.currentScreen === 4 && state.revisionCount === 0) return { ...state, currentScreen: 3 }
      if (state.currentScreen === 5) return { ...state, currentScreen: 4 }
      if (state.currentScreen === 7) return { ...state, currentScreen: 6 }
      return state
    }

    case 'reset': {
      return createInitialSessionState()
    }

    default: {
      return state
    }
  }
}