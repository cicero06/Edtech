import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { DialogueDefinition } from '../types/dialogue.ts'
import { PrimaryButton } from './PrimaryButton.tsx'

interface CharacterDialogueProps {
  dialogue: DialogueDefinition
  onComplete?: () => void
  children?: ReactNode
}

// A different conversation resets its card position automatically.
export function CharacterDialogue(props: CharacterDialogueProps) {
  return <DialogueCards key={props.dialogue.id} {...props} />
}

function DialogueCards({ dialogue, onComplete, children }: CharacterDialogueProps) {
  const [step, setStep] = useState(0)
  const [failedPortrait, setFailedPortrait] = useState<string | null>(null)
  const labelId = useId()
  const { character, steps } = dialogue
  const lastStep = step === steps.length - 1

  return (
    <section className="character-dialogue" aria-labelledby={labelId}>
      <div className="character-identity">
        {!character.portrait || failedPortrait === character.portrait
          ? <span className="character-portrait" role="img" aria-label={character.portraitAlt}>{character.fallback}</span>
          : <img className="character-portrait" src={`${import.meta.env.BASE_URL}${character.portrait}`} alt={character.portraitAlt} width="80" height="96" onError={() => setFailedPortrait(character.portrait ?? null)} />}
        <div><strong id={labelId}>{character.name}</strong>{character.role && <small className="character-role">{character.role}</small>}</div>
      </div>
      <div className="character-speech" aria-live="polite" aria-atomic="true">
        <p>{steps[step]}</p>
        {steps.length > 1 && <small>{step + 1} / {steps.length}</small>}
      </div>
      {children}
      {(!lastStep || onComplete) && (
        <PrimaryButton className="dialogue-next" onClick={() => {
          if (lastStep) onComplete?.()
          else setStep((current) => Math.min(current + 1, steps.length - 1))
        }}>
          {lastStep ? dialogue.completeLabel : dialogue.nextLabel}
        </PrimaryButton>
      )}
    </section>
  )
}
