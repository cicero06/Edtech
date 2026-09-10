import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { EvidenceSource, SourceId } from '../types/scenario.ts'

const sourceClasses: Record<SourceId, string> = {
  municipality_engineer: 'engineer',
  farmer: 'farmer',
  environmental_expert: 'environmental',
  water_usage: 'usage',
  social_media: 'social',
  municipality_budget: 'budget',
}

function SourceIcon({ sourceId }: { sourceId: SourceId }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {sourceId === 'municipality_engineer' && <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5h5v5h-5zM17 12h3" /></>}
      {sourceId === 'farmer' && <><path d="M4 8h11v8H4zM15 11h3l2 3v2h-5M7 8V5h5v3" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>}
      {sourceId === 'environmental_expert' && <><path d="M12 21v-9M12 14c-5 0-7-3-7-7 4 0 7 2 7 7Zm0 3c5 0 7-3 7-7-4 0-7 2-7 7Z" /></>}
      {sourceId === 'water_usage' && <><path d="M5 20v-7h3v7M11 20V8h3v12M17 20V4h3v16" /></>}
      {sourceId === 'social_media' && <><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 9h8M8 13h5" /></>}
      {sourceId === 'municipality_budget' && <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h4" /></>}
    </svg>
  )
}

function SourceDetail({ sourceId }: { sourceId: SourceId }) {
  const source: EvidenceSource = waterCrisisScenario.sources.find(({ id }) => id === sourceId)!
  const content = source.content ?? (
    sourceId === 'municipality_budget'
      ? `Kasabanın başlangıç bütçesi ${waterCrisisScenario.initialState.budget}.`
      : 'Bu kaynak için ayrıntılı açıklama henüz sunulmadı.'
  )

  return (
    <section className="source-detail" aria-live="polite" aria-labelledby="selected-source-title">
      <div className="detail-heading">
        <span className={`source-icon ${sourceClasses[source.id]}`}><SourceIcon sourceId={source.id} /></span>
        <div>
          <span className="selected-source-label">SEÇİLİ KAYNAK</span>
          <h2 id="selected-source-title">{source.name}</h2>
        </div>
        <span className="evidence-type">Kaynak türü: {source.evidenceType ?? source.type}</span>
      </div>
      {sourceId === 'water_usage' ? (
        <div className="distribution-grid">
          {waterCrisisScenario.waterUseDistribution.map((item) => (
            <div key={item.name}><strong>%{item.percentage}</strong><span>{item.name}</span></div>
          ))}
        </div>
      ) : (
        <blockquote className={sourceId === 'social_media' ? 'unverified' : ''}>“{content}”</blockquote>
      )}
      {sourceId === 'social_media' && <p className="source-warning">Bu paylaşım doğrulanmamış bir iddiadır.</p>}
    </section>
  )
}

export function ResearchScreen() {
  const { state, openSource, requestHint, continueToPlanning } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const lastSourceId = [...state.events].reverse().find(({ eventType }) => eventType === 'source_opened')?.target
  const selectedSource = waterCrisisScenario.sources.find(({ id }) => id === lastSourceId)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={3} showResources />
      <main className="research-layout">
        <section className="research-workspace" aria-labelledby="research-title">
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
                  onClick={() => openSource(source.id)}
                >
                  <span className={`source-icon ${sourceClasses[source.id]}`}><SourceIcon sourceId={source.id} /></span>
                  <strong>{source.name}</strong>
                  <small>{source.type}</small>
                  {viewed && <span className="viewed-status">İncelendi</span>}
                </button>
              )
            })}
          </div>
          {selectedSource ? <SourceDetail sourceId={selectedSource.id} /> : (
            <div className="source-empty"><p>Detaylarını görmek için bir bilgi kaynağı seç.</p></div>
          )}
        </section>
        <aside className="research-sidebar" aria-labelledby="research-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="research-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Karar vermeden önce farklı bilgi kaynaklarını incele.</p>
            {state.hintCount === 0 ? (
              <button className="hint-button" type="button" onClick={requestHint}>İPUCU GÖSTER</button>
            ) : (
              <p className="hint-box" role="status"><strong>İpucu:</strong> Tüm kaynaklar aynı derecede güvenilir olmayabilir.</p>
            )}
            <div className="checklist-heading research-checklist-heading">
              <h2>İNCELENEN KAYNAKLAR</h2>
              <span>{state.viewedSources.length} / {waterCrisisScenario.sources.length} İncelendi</span>
            </div>
            <ul className="source-checklist">
              {waterCrisisScenario.sources.map((source) => {
                const viewed = state.viewedSources.includes(source.id)
                return (
                  <li key={source.id}>
                    <button type="button" className={viewed ? 'viewed' : ''} onClick={() => openSource(source.id)}>
                      <span className="check-box" aria-hidden="true">{viewed ? '✓' : ''}</span>
                      <span>{source.name}</span>
                      <small>{viewed ? 'İncelendi' : 'Bekliyor'}</small>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <PrimaryButton onClick={continueToPlanning}>PLAN OLUŞTURMAYA GEÇ</PrimaryButton>
        </aside>
      </main>
    </>
  )
}
