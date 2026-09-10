import { createContext, useContext } from 'react'
import type { SessionState } from '../types/session.ts'

interface SessionContextValue {
  state: SessionState
  startSession: () => void
  resetSession: () => void
  storageAvailable: boolean
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}
