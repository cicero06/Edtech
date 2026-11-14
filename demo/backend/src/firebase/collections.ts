/**
 * Firestore collection names for HarmonyTown. Document ids are UUIDs (v4)
 * unless noted, so existing API routes (ParseUUIDPipe) keep working.
 *
 *   adultUsers/{authSubject}          staff / blog writers (Firebase uid)
 *   workspaces/{id}                   school or pilot
 *   memberships/{workspaceId}_{uid}   role of an adult in a workspace
 *   groups/{id}                       class; joinCodes/{CODE} reserves code
 *   participants/{id}                 roster student (no account)
 *   participantTokens/{sha256}        opaque bearer tokens for students
 *   scenarioVersions/{scenario@ver}   immutable manifest
 *   activities/{id}                   class session
 *   attempts/{id}                     one play-through (+ inline state)
 *   attempts/{id}/events/{clientId}   learning events
 *   blogPosts/{id}                    writer console posts
 *   v1Sessions/{id}/events/{auto}     legacy v1 demo telemetry
 */
export const C = {
  adultUsers: 'adultUsers',
  workspaces: 'workspaces',
  memberships: 'memberships',
  groups: 'groups',
  joinCodes: 'joinCodes',
  participants: 'participants',
  participantTokens: 'participantTokens',
  scenarioVersions: 'scenarioVersions',
  activities: 'activities',
  attempts: 'attempts',
  events: 'events',
  blogPosts: 'blogPosts',
  v1Sessions: 'v1Sessions',
} as const;
