import type { CharacterDefinition } from './dialogue.ts'

type EvidenceContent =
  | { kind: 'character'; character: CharacterDefinition; speech: readonly [string, ...string[]] }
  | { kind: 'distribution'; description: string }
  | { kind: 'claim'; quote: string; verification: { title: string; text: string }; guidance: string }
  | { kind: 'budget'; title: string; description: string; explanation: { title: string; text: string } }

export type EvidenceDetail = EvidenceContent & { takeaway: string }
