import { useEffect, useId, useRef } from 'react'
import type { EvidenceSource } from '../types/scenario.ts'
import type { EvidenceDetail } from '../types/evidence.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import { CharacterDialogue } from './CharacterDialogue.tsx'
import { PrimaryButton } from './PrimaryButton.tsx'
import { SourceIcon } from './SourceIcon.tsx'

interface EvidenceSourceDetailProps {
  source: EvidenceSource
  detail: EvidenceDetail
  reviewed: boolean
  onReview: () => void
}

export function EvidenceSourceDetail({ source, detail, reviewed, onReview }: EvidenceSourceDetailProps) {
  const titleId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [source.id])

  return (
    <section id="evidence-detail" className="source-detail" aria-labelledby={titleId}>
      <div className="detail-heading">
        <SourceIcon sourceId={source.id} />
        <div><span className="selected-source-label">SEÇİLİ KAYNAK</span><h2 ref={heading} tabIndex={-1} id={titleId}>{source.name}</h2></div>
        <span className="evidence-type">Kaynak türü: {source.type}</span>
      </div>
      {detail.kind === 'character' && (
        <CharacterDialogue dialogue={{ id: `evidence-${source.id}`, character: detail.character, steps: [detail.speech[0]], nextLabel: 'Devam', completeLabel: 'Kaynağı inceledim' }}>
          <div className="area-conversation">{detail.speech.slice(1).map((text) => <p key={text}>{text}</p>)}</div>
        </CharacterDialogue>
      )}
      {detail.kind === 'distribution' && (
        <figure className="evidence-chart">
          <figcaption>Kasabadaki su kullanım dağılımı</figcaption>
          <ul>{waterCrisisScenario.waterUseDistribution.map((item) => (
            <li key={item.name}>
              <div><span>{item.name}</span><strong>%{item.percentage}</strong></div>
              <div className="evidence-bar" aria-hidden="true"><span style={{ width: `${item.percentage}%` }} /></div>
            </li>
          ))}</ul>
          <p>{detail.description}</p>
        </figure>
      )}
      {detail.kind === 'claim' && (
        <>
          <blockquote className="unverified">“{detail.quote}”</blockquote>
          <div className="evidence-note evidence-verification"><h3>{detail.verification.title}</h3><p>{detail.verification.text}</p></div>
          <p className="evidence-guidance">{detail.guidance}</p>
        </>
      )}
      {detail.kind === 'budget' && (
        <>
          <div className="evidence-budget"><h3>{detail.title}</h3><p>Başlangıç bütçesi: <strong>{waterCrisisScenario.initialState.budget} birim</strong></p><p>{detail.description}</p></div>
          <div className="evidence-note"><h3>{detail.explanation.title}</h3><p>{detail.explanation.text}</p></div>
        </>
      )}
      <div className="evidence-takeaway"><h3>Bu kaynaktan ne öğrendik?</h3><p>{detail.takeaway}</p></div>
      <PrimaryButton onClick={onReview} disabled={reviewed}>{reviewed ? '✓ KAYNAK İNCELENDİ' : 'KAYNAĞI İNCELEDİM'}</PrimaryButton>
    </section>
  )
}
