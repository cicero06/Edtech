import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { InterventionId } from '../types/scenario.ts'

const impactLabels: Record<InterventionId, readonly [string, string]> = {
  'network-leak-repair': ['Su etkisi: yüksek', 'Çevresel risk: düşük'],
  'reduce-agricultural-irrigation': ['Su etkisi: yüksek', 'Tarım etkisi: olumsuz olabilir'],
  'reduce-park-irrigation': ['Su etkisi: düşük', 'Çevresel etki: orta'],
  'rainwater-harvesting': ['Su etkisi: orta', 'Uzun vadeli fayda: yüksek'],
  'new-well': ['Kısa vadeli su etkisi: yüksek', 'Uzun vadeli çevresel sonuç: belirsiz'],
}

function InterventionIcon({ interventionId }: { interventionId: InterventionId }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {interventionId === 'network-leak-repair' && <path d="m14 6 4-4 4 4-4 4M18 6 8 16m-2-2-4 4 4 4 4-4" />}
      {interventionId === 'reduce-agricultural-irrigation' && <><path d="M12 3a9 9 0 1 0 9 9h-9V3Z" /><path d="m12 12-8-4m8 4 4 8" /></>}
      {interventionId === 'reduce-park-irrigation' && <><path d="M12 21v-9M12 14c-5 0-7-3-7-7 4 0 7 2 7 7Zm0 3c5 0 7-3 7-7-4 0-7 2-7 7Z" /></>}
      {interventionId === 'rainwater-harvesting' && <><path d="M5 15a6 6 0 0 1 10.5-4A4 4 0 1 1 18 18H7a4 4 0 0 1-2-3Z" /><path d="M9 16v5m4-5v5m4-5v5" /></>}
      {interventionId === 'new-well' && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
    </svg>
  )
}

export function PlanningScreen() {
  const { state, viewIntervention, selectIntervention, removeIntervention, continueToDecision } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const budget = waterCrisisScenario.initialState.budget
  const usedBudget = state.selectedInterventions.reduce((total, id) =>
    total + (waterCrisisScenario.interventions.find((item) => item.id === id)?.cost ?? 0), 0)
  const reviewed = new Set(state.events.flatMap((event) =>
    event.eventType === 'intervention_viewed' && event.target ? [event.target] : []))
  const activeId = [...state.events].reverse().find(({ eventType }) => eventType === 'intervention_viewed')?.target

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={4} showResources />
      <main className="planning-layout">
        <section className="planning-workspace" aria-labelledby="planning-options-title">
          <div className="planning-heading">
            <div><span>PLANLAMA &amp; MÜDAHALE</span><p>Kasaba için çözüm seçeneklerini incele ve seçimini yap.</p></div>
            <div><h2 id="planning-options-title">ÇÖZÜM SEÇENEKLERİ</h2><small>En fazla 3 müdahale seçilebilir</small></div>
          </div>
          <div className="intervention-list">
            {waterCrisisScenario.interventions.map((intervention, index) => {
              const selected = state.selectedInterventions.includes(intervention.id)
              const exceedsCount = state.selectedInterventions.length >= waterCrisisScenario.limits.maxInterventions
              const exceedsBudget = usedBudget + intervention.cost > budget
              const disabled = !selected && (exceedsCount || exceedsBudget)
              const disabledReason = exceedsCount
                ? 'En fazla 3 müdahale seçebilirsin.'
                : 'Bu seçenek mevcut seçimlerle bütçeyi aşar.'
              return (
                <article className={`intervention-card${selected ? ' selected' : ''}${activeId === intervention.id ? ' active' : ''}`} key={intervention.id}>
                  <button className="intervention-info" type="button" onClick={() => viewIntervention(intervention.id)} aria-label={`${intervention.name} etkilerini incele`}>
                    <span className="intervention-icon"><InterventionIcon interventionId={intervention.id} /></span>
                    <span className="intervention-copy">
                      <span className="intervention-title"><strong>{index + 1}. {intervention.name}</strong><small>Maliyet: {intervention.cost}</small></span>
                      <span className="impact-chips"><small>{impactLabels[intervention.id][0]}</small><small>{impactLabels[intervention.id][1]}</small></span>
                    </span>
                    {reviewed.has(intervention.id) && <span className="reviewed-label">İncelendi</span>}
                  </button>
                  <button
                    className="selection-toggle"
                    type="button"
                    disabled={disabled}
                    title={disabled ? disabledReason : undefined}
                    aria-label={selected ? `${intervention.name} seçimini kaldır` : `${intervention.name} seç`}
                    aria-pressed={selected}
                    onClick={() => selected ? removeIntervention(intervention.id) : selectIntervention(intervention.id)}
                  >
                    {selected ? '✓ Seçildi' : 'Seç'}
                  </button>
                </article>
              )
            })}
          </div>
          <div className="plan-summary" aria-label="Seçilen plan özeti">
            <strong>SEÇİLEN PLAN ÖZETİ</strong>
            <div><span>Toplam bütçe: <b>{budget}</b></span><span>Seçilen çözüm: <b>{state.selectedInterventions.length} / {waterCrisisScenario.limits.maxInterventions}</b></span></div>
            <div><span>Kullanılan bütçe: <b>{usedBudget}</b></span><span>Kalan bütçe: <b>{budget - usedBudget}</b></span></div>
          </div>
        </section>
        <aside className="planning-sidebar" aria-labelledby="planning-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="planning-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Kasabanın su sorununu çözmek için uygun müdahaleleri seç.</p>
            <p className="planning-note"><strong>Düşünme notu:</strong> En yüksek su tasarrufu her zaman en dengeli çözüm olmayabilir.</p>
            <h2 className="rules-title">KURALLAR</h2>
            <ul className="planning-rules">
              <li><span>✓</span>En fazla 3 çözüm seç.</li>
              <li><span>✓</span>Bütçeyi aşma.</li>
              <li><span>✓</span>Farklı etkileri birlikte düşün.</li>
            </ul>
          </div>
          <PrimaryButton onClick={continueToDecision}>KARAR AŞAMASINA GEÇ</PrimaryButton>
        </aside>
      </main>
    </>
  )
}
