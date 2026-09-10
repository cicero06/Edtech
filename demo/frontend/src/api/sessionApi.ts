import type { SessionEvent } from '../types/session.ts'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export function isSessionApiEnabled(): boolean {
  return Boolean(apiUrl)
}

export async function createRemoteSession(): Promise<string | null> {
  if (!apiUrl) return null
  const response = await fetch(`${apiUrl}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId: 'water-crisis' }),
  })
  if (!response.ok) throw new Error(`Session API returned ${response.status}`)
  const session: unknown = await response.json()
  if (!session || typeof session !== 'object' || !('id' in session) || typeof session.id !== 'string') {
    throw new Error('Session API returned an invalid response')
  }
  return session.id
}

export async function sendRemoteEvent(sessionId: string, event: SessionEvent): Promise<void> {
  if (!apiUrl) return
  const response = await fetch(`${apiUrl}/sessions/${sessionId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
  if (!response.ok) throw new Error(`Event API returned ${response.status}`)
}
