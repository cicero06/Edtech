import type { CharacterDefinition } from './dialogue.ts'

export type AreaContent =
  | { type: 'speech'; text: string }
  | { type: 'list'; items: readonly string[] }

export interface AreaDefinition {
  title: string
  subtitle: string
  icon: string
  character: CharacterDefinition
  opening: string
  content: readonly AreaContent[]
  fact?: { title: string; text: string }
  clue: string
}
