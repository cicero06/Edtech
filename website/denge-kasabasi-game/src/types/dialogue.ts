export interface CharacterDefinition {
  id: string
  name: string
  role?: string
  portrait?: string
  portraitAlt: string
  fallback: string
}

export interface DialogueDefinition {
  id: string
  character: CharacterDefinition
  steps: readonly [string, ...string[]]
  nextLabel: string
  completeLabel: string
}
