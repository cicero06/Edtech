import type {
  InterventionId,
  LocationId,
  ReasonId,
  SourceId,
} from './scenario.ts'

export type ScreenNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Confidence = 1 | 2 | 3 | 4 | 5

export type RevisionCount = 0 | 1

export type ScreenName =
  | 'intro'
  | 'town-map'
  | 'research'
  | 'planning'
  | 'decision'
  | 'outcome'
  | 'reflection'
  | 'session-summary'

export type EventType =
  | 'session_started'
  | 'location_opened'
  | 'source_opened'
  | 'intervention_viewed'
  | 'intervention_selected'
  | 'intervention_removed'
  | 'reason_selected'
  | 'confidence_submitted'
  | 'plan_submitted'
  | 'outcome_viewed'
  | 'new_evidence_viewed'
  | 'hint_requested'
  | 'reflection_answered'
  | 'strategy_changed'
  | 'plan_revised'
  | 'session_completed'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface SessionEvent {
  eventType: EventType
  timestamp: string
  screen: ScreenName
  target?: string
  value?: JsonValue
  metadata?: Record<string, JsonValue>
}

export interface SessionState {
  sessionId: string | null

  currentScreen: ScreenNumber

  exploredLocations: readonly LocationId[]

  viewedSources: readonly SourceId[]

  selectedInterventions: readonly InterventionId[]

  selectedReason: ReasonId | null

  confidence: Confidence | null

  outcomeViewed: boolean

  newEvidenceViewed: boolean

  reflectionUnexpectedResult: boolean | null

  wantsRevision: boolean | null

  revisionCount: RevisionCount

  hintCount: number

  completed: boolean

  events: readonly SessionEvent[]
}

export type SessionAction =
  | {
      type: 'start'
      sessionId: string
      timestamp: string
    }
  | {
      type: 'openLocation'
      locationId: LocationId
      timestamp: string
    }
  | {
      type: 'continueToResearch'
    }
  | {
      type: 'openSource'
      sourceId: SourceId
      timestamp: string
    }
  | {
      type: 'requestHint'
      timestamp: string
    }
  | {
      type: 'continueToPlanning'
    }
  | {
      type: 'viewIntervention'
      interventionId: InterventionId
      timestamp: string
    }
  | {
      type: 'selectIntervention'
      interventionId: InterventionId
      timestamp: string
    }
  | {
      type: 'removeIntervention'
      interventionId: InterventionId
      timestamp: string
    }
  | {
      type: 'continueToDecision'
    }
  | {
      type: 'selectReason'
      reasonId: ReasonId
      timestamp: string
    }
  | {
      type: 'setConfidence'
      confidence: Confidence
      timestamp: string
    }
  | {
      type: 'submitPlan'
      timestamp: string
    }
  | {
      type: 'viewOutcome'
      timestamp: string
    }
  | {
      type: 'viewNewEvidence'
      timestamp: string
    }
  | {
      type: 'continueFromOutcome'
    }
  | {
      type: 'setUnexpectedResult'
      value: boolean
    }
  | {
      type: 'setWantsRevision'
      value: boolean
    }
  | {
      type: 'submitReflection'
      timestamp: string
    }
  | {
      type: 'completeSession'
      timestamp: string
    }
  | {
      type: 'navigateBack'
    }
  | {
      type: 'reset'
    }