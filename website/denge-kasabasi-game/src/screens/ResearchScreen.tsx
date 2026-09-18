import { EvidenceSourceDetail } from '../components/EvidenceSourceDetail.tsx'
import { SourceIcon } from '../components/SourceIcon.tsx'
import { CharacterDialogue } from '../components/CharacterDialogue.tsx'
import { lina } from '../data/characterDialogues.ts'
import { evidenceSources, researchGuide } from '../data/evidenceSources.ts'
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { SourceId } from '../types/scenario.ts'

export function ResearchScreen() {
  const { state, openSource, requestHint, continueToPlanning } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const lastSourceId = [...state.events].reverse().find(({ eventType }) => eventType === 'source_opened')?.target
  const [selectedSourceId, setSelectedSourceId] = useState<SourceId | null>(() => waterCrisisScenario.sources.find(({ id }) => id === lastSourceId)?.id ?? null)
  const selectedSource = waterCrisisScenario.sources.find(({ id }) => id === selectedSourceId)
  const reviewedSources = state.viewedSources
  const allReviewed = waterCrisisScenario.sources.every(({ id }) => reviewedSources.includes(id))

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={3} showResources />
      <main className="research-layout">
        <section className="research-workspace" aria-label="Araştırma ve kanıt toplama">
          <div className="research-heading">
            <div><span>ARAŞTIRMA &amp; KANIT TOPLAMA</span><p>Her kaynağı inceleyerek farklı bilgi türlerini gör.</p></div>
            <strong>BİLGİ KAYNAKLARI</strong>
          </div>
          <div className="source-grid">
            {waterCrisisScenario.sources.map((source) => {
              const viewed = state.viewedSources.includes(source.id)
              const selected = selectedSource?.id === source.id
              return (
                <button
                  key={source.id}
                  type="button"
                  className={`source-card${selected ? ' selected' : ''}`}
                  aria-pressed={selected}
                  aria-controls="evidence-detail"
                  onClick={() => setSelectedSourceId(source.id)}
                >
                  <SourceIcon sourceId={source.id} />
                  <strong>{source.name}</strong>
                  <small>{source.type}</small>
                  {viewed && <span className="viewed-status">✓ İncelendi</span>}
                </button>
              )
            })}
          </div>
          {selectedSource ? <EvidenceSourceDetail key={selectedSource.id} source={selectedSource} detail={evidenceSources[selectedSource.id]}
            reviewed={reviewedSources.includes(selectedSource.id)}
            onReview={() => { if (!reviewedSources.includes(selectedSource.id)) openSource(selectedSource.id) }} /> : (
            <div id="evidence-detail" className="source-empty"><p>Detaylarını görmek için bir bilgi kaynağı seç.</p></div>
          )}
        </section>
        <aside className="research-sidebar" aria-labelledby="research-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="research-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Karar vermeden önce farklı bilgi kaynaklarını incele.</p>
            <div className="research-guide">
              <CharacterDialogue dialogue={{ id: allReviewed ? 'research-complete' : 'research-intro', character: lina,
                steps: [allReviewed ? researchGuide.complete : researchGuide.introduction], nextLabel: 'Devam', completeLabel: 'Plan oluşturmaya geç' }} />
            </div>
            {state.hintCount === 0 ? (
              <button className="hint-button" type="button" onClick={requestHint}>İPUCU GÖSTER</button>
            ) : (
              <p className="hint-box" role="status" aria-label="Araştırma ipucu"><strong>İpucu:</strong> {researchGuide.hint}</p>
            )}
            <div className="exploration-progress">
              <span role="status" aria-label="Kaynak ilerlemesi">{reviewedSources.length} / {waterCrisisScenario.sources.length} kaynak incelendi</span>
              <progress aria-label="İncelenen kaynaklar" max={waterCrisisScenario.sources.length} value={reviewedSources.length} />
            </div>
          </div>
          <div>
            <PrimaryButton onClick={continueToPlanning} disabled={!allReviewed} aria-describedby={!allReviewed ? 'research-required' : undefined}>PLAN OLUŞTURMAYA GEÇ</PrimaryButton>
            {!allReviewed && <p className="decision-requirement" id="research-required">{researchGuide.requirement}</p>}
          </div>
        </aside>
      </main>
    </>
  )
}
