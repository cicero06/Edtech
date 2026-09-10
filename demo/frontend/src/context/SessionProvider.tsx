import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SessionContext } from './sessionContext.ts'
import { sessionReducer } from './sessionReducer.ts'
import { loadSessionState, saveSessionState } from '../utils/sessionStorage.ts'
import type { SessionAction } from '../types/session.ts'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, loadSessionState)
  const currentState = useRef(state)
  const [storageAvailable, setStorageAvailable] = useState(true)

  const applyAction = useCallback((action: SessionAction) => {
    const nextState = sessionReducer(currentState.current, action)
    if (nextState === currentState.current) return
    currentState.current = nextState
    setStorageAvailable(saveSessionState(nextState))
    dispatch(action)
  }, [])

  const startSession = useCallback(() => {
    applyAction({ type: 'start', sessionId: crypto.randomUUID(), timestamp: new Date().toISOString() })
  }, [applyAction])

  const resetSession = useCallback(() => {
    applyAction({ type: 'reset' })
  }, [applyAction])

  const value = useMemo(() => ({ state, startSession, resetSession, storageAvailable }),
    [state, startSession, resetSession, storageAvailable])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
