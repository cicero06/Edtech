import { SolutionDetail } from '../components/SolutionDetail.tsx'
import { PlanSummary } from '../components/PlanSummary.tsx'
import { PlanConfirmation } from '../components/PlanConfirmation.tsx'
import { CharacterDialogue } from '../components/CharacterDialogue.tsx'
import { lina } from '../data/characterDialogues.ts'
import { solutions, planningCopy } from '../data/solutions.ts'
import { evidenceSources } from '../data/evidenceSources.ts'
import { summarizePlan } from '../utils/planSummary.ts'
import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { InterventionId } from '../types/scenario.ts'

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
  const plan = summarizePlan(state.selectedInterventions, state.revisionCount)
  const usedBudget = plan.usedBudget
  const [expandedId, setExpandedId] = useState<InterventionId | null>(null)
  const [selectionMessage, setSelectionMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const continueButton = useRef<HTMLButtonElement>(null)
  const showDetail = (id: InterventionId) => { setExpandedId(id); viewIntervention(id) }
  const reviewed = new Set(state.events.flatMap((event) =>
    event.eventType === 'intervention_viewed' && event.target ? [event.target] : []))

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
              const unavailable = !selected && (exceedsCount || exceedsBudget)
              const disabledReason = exceedsBudget
                ? `Bu çözümü plana eklemek için yeterli bütçen yok. ${usedBudget + intervention.cost - budget} bütçe puanına daha ihtiyacın var.`
                : `En fazla ${waterCrisisScenario.limits.maxInterventions} çözüm seçebilirsin. Önce bir seçimi kaldır.`
              return (
                <article className={`intervention-card${selected ? ' selected' : ''}${expandedId === intervention.id ? ' active' : ''}`} key={intervention.id}>
                  <button className="intervention-info" type="button" aria-expanded={expandedId === intervention.id} aria-controls={`solution-${intervention.id}`} onClick={() => { if (expandedId === intervention.id) setExpandedId(null); else showDetail(intervention.id) }} aria-label={`${intervention.name} etkilerini incele`}>
                    <span className="intervention-icon"><InterventionIcon interventionId={intervention.id} /></span>
                    <span className="intervention-copy">
                      <span className="intervention-title"><strong>{index + 1}. {intervention.name}</strong><small>💰 Maliyet: {intervention.cost}</small></span>
                      <span className="impact-chips">{solutions[intervention.id].labels.map((label) => <small key={label}>{label}</small>)}</span>
                    </span>
                    {reviewed.has(intervention.id) && <span className="reviewed-label">İncelendi</span>}
                  </button>
                  <button
                    className={`selection-toggle${unavailable ? ' unavailable' : ''}`}
                    type="button"
                    title={unavailable ? disabledReason : undefined}
                    aria-label={selected ? `${intervention.name} seçimini kaldır` : `${intervention.name} seç`}
                    aria-pressed={selected}
                    onClick={() => {
                      setConfirming(false)
                      if (selected) { removeIntervention(intervention.id); setSelectionMessage(''); return }
                      showDetail(intervention.id)
                      if (unavailable) { setSelectionMessage(disabledReason); return }
                      selectIntervention(intervention.id)
                      setSelectionMessage('')
                    }}
                  >
                    {selected ? '✓ Seçildi' : 'Seç'}
                  </button>
                  {unavailable && <p className="solution-constraint">{disabledReason}</p>}
                  <div className="solution-evidence" aria-label="İlgili kanıtlar">
                    <span>🔎 İlgili kanıtlar</span>
                    {solutions[intervention.id].evidenceLinks.map((id) => {
                      const source = waterCrisisScenario.sources.find((item) => item.id === id)!
                      return <details key={id}><summary>{source.name}</summary><p>{evidenceSources[id].takeaway}</p><small>{state.viewedSources.includes(id) ? '✓ Araştırmada inceledin' : 'Araştırmada henüz incelenmedi'}</small></details>
                    })}
                  </div>
                  {expandedId === intervention.id && <SolutionDetail intervention={intervention} />}
                </article>
              )
            })}
          </div>
          <p className="selection-message" role="status">{selectionMessage}</p>
          <PlanSummary plan={plan} />
        </section>
        <aside className="planning-sidebar" aria-labelledby="planning-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="planning-title" ref={heading} tabIndex={-1}>Planını Oluştur</h1>
            <p className="task-lead">Kasabanın su sorununu çözmek için uygun müdahaleleri seç.</p>
            <div className="research-guide"><CharacterDialogue dialogue={{ id: 'lina-planning', character: lina, steps: [planningCopy.guidance], nextLabel: 'Devam', completeLabel: 'Tamam' }} /></div>
            <div className="planning-live" aria-live="polite"><p>{plan.selected.length} / {waterCrisisScenario.limits.maxInterventions} çözüm seçildi</p><p>{usedBudget} / {budget} bütçe kullanıldı</p></div>
            <h2 className="rules-title">KURALLAR</h2>
            <ul className="planning-rules">
              <li><span>✓</span>En fazla 3 çözüm seç.</li>
              <li><span>✓</span>Bütçeyi aşma.</li>
              <li><span>✓</span>Farklı etkileri birlikte düşün.</li>
            </ul>
            <p className="planning-freedom">{planningCopy.budgetFreedom}</p>
            <ul className="plan-feedback" aria-live="polite">
              {plan.agricultureRisk && <li>⚠ Tarım etkisi olan bir çözüm seçtin.</li>}
              {plan.longTermBenefit && <li>🔮 Uzun vadeli fayda potansiyeli sağlayan bir çözüm var.</li>}
              {plan.environmentalRisk && <li>🌳 Yeşil alanları etkileyebilecek bir çözüm seçtin.</li>}
              {plan.environmentalUncertainty && <li>⚠ Planında çevresel belirsizlik bulunuyor.</li>}
            </ul>
          </div>
          {confirming ? <PlanConfirmation plan={plan} onConfirm={continueToDecision} onChange={() => {
            setConfirming(false)
            requestAnimationFrame(() => continueButton.current?.focus())
          }} /> : <div>
            <PrimaryButton ref={continueButton} disabled={plan.selected.length === 0} onClick={() => setConfirming(true)}>KARAR AŞAMASINA GEÇ</PrimaryButton>
            {plan.selected.length === 0 && <p className="decision-requirement">Devam etmek için en az 1 çözüm seç.</p>}
          </div>}
        </aside>
      </main>
    </>
  )
}
