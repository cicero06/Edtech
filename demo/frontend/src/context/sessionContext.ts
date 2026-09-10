import { createContext, useContext } from 'react'
import type { InterventionId, LocationId, ReasonId, SourceId } from '../types/scenario.ts'
import type { Confidence, SessionState } from '../types/session.ts'

interface SessionContextValue {
  state: SessionState
  startSession: () => void
  openLocation: (locationId: LocationId) => void
  continueToResearch: () => void
  openSource: (sourceId: SourceId) => void
  requestHint: () => void
  continueToPlanning: () => void
  viewIntervention: (interventionId: InterventionId) => void
  selectIntervention: (interventionId: InterventionId) => void
  removeIntervention: (interventionId: InterventionId) => void
  continueToDecision: () => void
  selectReason: (reasonId: ReasonId) => void
  setConfidence: (confidence: Confidence) => void
  submitPlan: () => void
  viewOutcome: () => void
  viewNewEvidence: () => void
  continueFromOutcome: () => void
  setUnexpectedResult: (value: boolean) => void
  setWantsRevision: (value: boolean) => void
  submitReflection: () => void
  completeSession: () => void
  navigateBack: () => void
  resetSession: () => void
  storageAvailable: boolean
  apiSyncFailed: boolean
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}
