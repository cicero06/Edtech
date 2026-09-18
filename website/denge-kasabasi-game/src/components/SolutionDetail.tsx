import type { Intervention } from '../types/scenario.ts'
import { solutions } from '../data/solutions.ts'
import { evidenceSources } from '../data/evidenceSources.ts'
import { CharacterDialogue } from './CharacterDialogue.tsx'

export function SolutionDetail({ intervention }: { intervention: Intervention }) {
  const detail = solutions[intervention.id]
  const expert = evidenceSources[detail.characterSource]
  return (
    <section id={`solution-${intervention.id}`} className="solution-detail" aria-label={`${intervention.name} ayrıntıları`}>
      <h3>{intervention.name}</h3>
      <p>{detail.description}</p>
      <p><strong>💰 Maliyet: {intervention.cost} birim</strong></p>
      <div className="solution-tradeoffs">
        <div><h4>Olası faydalar</h4><ul>{detail.benefits.map((text) => <li key={text}>{text}</li>)}</ul></div>
        <div><h4>Olası riskler</h4><ul>{detail.risks.map((text) => <li key={text}>{text}</li>)}</ul></div>
      </div>
      {expert.kind === 'character' && <CharacterDialogue dialogue={{ id: intervention.id, character: expert.character, steps: [detail.comment], nextLabel: 'Devam', completeLabel: 'Tamam' }} />}
    </section>
  )
}
