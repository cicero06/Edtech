import { useEffect, useId, useRef } from 'react'
import type { AreaDefinition } from '../types/area.ts'
import { CharacterDialogue } from './CharacterDialogue.tsx'
import { PrimaryButton } from './PrimaryButton.tsx'

interface AreaInfoModalProps {
  area: AreaDefinition
  onClose: () => void
  onComplete: () => void
}

export function AreaInfoModal({ area, onClose, onComplete }: AreaInfoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const subtitleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current!
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      trigger?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog ref={dialogRef} className="area-modal" aria-labelledby={titleId} aria-describedby={subtitleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}>
      <div className="area-modal-heading">
        <div>
          <h2 id={titleId}><span aria-hidden="true">{area.icon}</span> {area.title}</h2>
          <p id={subtitleId}>{area.subtitle}</p>
        </div>
        <button className="area-modal-close" type="button" aria-label="Bilgi kartını kapat" onClick={onClose}>×</button>
      </div>
      <CharacterDialogue dialogue={{
        id: `area-${area.character.id}`, character: area.character,
        steps: [area.opening], nextLabel: 'Devam', completeLabel: 'İncelemeyi tamamla',
      }}>
        <div className="area-conversation">
          {area.content.map((block, index) => block.type === 'speech'
            ? <p key={index}>{block.text}</p>
            : <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>)}
        </div>
      </CharacterDialogue>
      {area.fact && <section className="area-fact"><h3>{area.fact.title}</h3><p>“{area.fact.text}”</p></section>}
      <section className="area-clue"><h3>Kazanılan ipucu</h3><p>{area.clue}</p></section>
      <PrimaryButton onClick={onComplete}>İNCELEMEYİ TAMAMLA</PrimaryButton>
    </dialog>
  )
}
