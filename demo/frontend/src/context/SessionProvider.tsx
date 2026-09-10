import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createRemoteSession, isSessionApiEnabled, sendRemoteEvent } from '../api/sessionApi.ts'
import { SessionContext } from './sessionContext.ts'
import { sessionReducer } from './sessionReducer.ts'
import { loadSessionState, saveSessionState } from '../utils/sessionStorage.ts'
import type { InterventionId, LocationId, ReasonId, SourceId } from '../types/scenario.ts'
import type { Confidence, SessionAction } from '../types/session.ts'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, loadSessionState)
  const currentState = useRef(state)
  const startInFlight = useRef(false)
  const syncFailed = useRef(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [apiSyncFailed, setApiSyncFailed] = useState(false)

  const applyAction = useCallback((action: SessionAction) => {
    const previousState = currentState.current
    const nextState = sessionReducer(previousState, action)
    if (nextState === previousState) return
    currentState.current = nextState
    setStorageAvailable(saveSessionState(nextState))
    dispatch(action)

    if (isSessionApiEnabled() && !syncFailed.current && nextState.sessionId) {
      const newEvents = nextState.events.slice(previousState.events.length)
      for (const event of newEvents) {
        void sendRemoteEvent(nextState.sessionId, event).catch(() => {
          syncFailed.current = true
          setApiSyncFailed(true)
        })
      }
    }
  }, [])

  const startSession = useCallback(async () => {
    if (startInFlight.current || currentState.current.sessionId !== null) return
    startInFlight.current = true
    let sessionId: string = crypto.randomUUID()
    if (isSessionApiEnabled()) {
      try {
        sessionId = await createRemoteSession() ?? sessionId
      } catch {
        syncFailed.current = true
        setApiSyncFailed(true)
      }
    }
    applyAction({ type: 'start', sessionId, timestamp: new Date().toISOString() })
    startInFlight.current = false
  }, [applyAction])

  const openLocation = useCallback((locationId: LocationId) => {
    applyAction({ type: 'openLocation', locationId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const continueToResearch = useCallback(() => {
    applyAction({ type: 'continueToResearch' })
  }, [applyAction])

  const openSource = useCallback((sourceId: SourceId) => {
    applyAction({ type: 'openSource', sourceId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const requestHint = useCallback(() => {
    applyAction({ type: 'requestHint', timestamp: new Date().toISOString() })
  }, [applyAction])

  const continueToPlanning = useCallback(() => {
    applyAction({ type: 'continueToPlanning' })
  }, [applyAction])

  const viewIntervention = useCallback((interventionId: InterventionId) => {
    applyAction({ type: 'viewIntervention', interventionId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const selectIntervention = useCallback((interventionId: InterventionId) => {
    applyAction({ type: 'selectIntervention', interventionId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const removeIntervention = useCallback((interventionId: InterventionId) => {
    applyAction({ type: 'removeIntervention', interventionId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const continueToDecision = useCallback(() => {
    applyAction({ type: 'continueToDecision' })
  }, [applyAction])

  const selectReason = useCallback((reasonId: ReasonId) => {
    applyAction({ type: 'selectReason', reasonId, timestamp: new Date().toISOString() })
  }, [applyAction])

  const setConfidence = useCallback((confidence: Confidence) => {
    applyAction({ type: 'setConfidence', confidence, timestamp: new Date().toISOString() })
  }, [applyAction])

  const submitPlan = useCallback(() => {
    applyAction({ type: 'submitPlan', timestamp: new Date().toISOString() })
  }, [applyAction])

  const viewOutcome = useCallback(() => {
    applyAction({ type: 'viewOutcome', timestamp: new Date().toISOString() })
  }, [applyAction])

  const viewNewEvidence = useCallback(() => {
    applyAction({ type: 'viewNewEvidence', timestamp: new Date().toISOString() })
  }, [applyAction])

  const continueFromOutcome = useCallback(() => {
    applyAction({ type: 'continueFromOutcome' })
  }, [applyAction])

  const setUnexpectedResult = useCallback((value: boolean) => {
    applyAction({ type: 'setUnexpectedResult', value })
  }, [applyAction])

  const setWantsRevision = useCallback((value: boolean) => {
    applyAction({ type: 'setWantsRevision', value })
  }, [applyAction])

  const submitReflection = useCallback(() => {
    applyAction({ type: 'submitReflection', timestamp: new Date().toISOString() })
  }, [applyAction])

  const completeSession = useCallback(() => {
    applyAction({ type: 'completeSession', timestamp: new Date().toISOString() })
  }, [applyAction])

  const navigateBack = useCallback(() => {
    applyAction({ type: 'navigateBack' })
  }, [applyAction])

  const resetSession = useCallback(() => {
    syncFailed.current = false
    setApiSyncFailed(false)
    applyAction({ type: 'reset' })
  }, [applyAction])

  const value = useMemo(() => ({
    state, startSession, openLocation, continueToResearch,
    openSource, requestHint, continueToPlanning,
    viewIntervention, selectIntervention, removeIntervention, continueToDecision,
    selectReason, setConfidence, submitPlan,
    viewOutcome, viewNewEvidence, continueFromOutcome,
    setUnexpectedResult, setWantsRevision, submitReflection, completeSession,
    navigateBack, resetSession, storageAvailable, apiSyncFailed,
  }), [
    state, startSession, openLocation, continueToResearch,
    openSource, requestHint, continueToPlanning,
    viewIntervention, selectIntervention, removeIntervention, continueToDecision,
    selectReason, setConfidence, submitPlan,
    viewOutcome, viewNewEvidence, continueFromOutcome,
    setUnexpectedResult, setWantsRevision, submitReflection, completeSession,
    navigateBack, resetSession, storageAvailable, apiSyncFailed,
  ])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
