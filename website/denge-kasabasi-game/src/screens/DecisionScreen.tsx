import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { Confidence } from '../types/session.ts'

const confidenceValues: readonly Confidence[] = [1, 2, 3, 4, 5]

export function DecisionScreen() {
  const { state, selectReason, setConfidence, submitPlan } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const budget = waterCrisisScenario.initialState.budget
  const selected = state.selectedInterventions.map((id) =>
    waterCrisisScenario.interventions.find((intervention) => intervention.id === id)!).filter(Boolean)
  const usedBudget = selected.reduce((total, intervention) => total + intervention.cost, 0)
  const ready = state.selectedReason !== null && state.confidence !== null

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={5} showResources />
      <main className="decision-layout">
        <section className="decision-workspace" aria-labelledby="decision-heading">
          <div className="story-identity-card" aria-label="Oyuncu özeti">
            <span className="story-identity-avatar" aria-hidden="true">🧑‍🌾</span>
            <div>
              <strong>Arda</strong>
              <small>Kasaba Mühendisi</small>
            </div>
          </div>
          <div className="decision-heading"><span>KARAR &amp; ONAY</span><p>Seçtiğin planı doğrula, gerekçeni belirt ve uygula.</p></div>
          <section className="selected-plan" aria-label="Seçilen plan özeti">
            <h2 id="selected-plan-title">SEÇİLEN PLAN</h2>
            {selected.length > 0 ? (
              <div className="selected-plan-items">
                {selected.map((intervention) => <div key={intervention.id}>{intervention.name}</div>)}
              </div>
            ) : (
              <p className="empty-plan">Bu plan için müdahale seçilmedi.</p>
            )}
            <div className="selected-plan-metrics">
              <span>Seçilen çözüm: <strong>{selected.length} / {waterCrisisScenario.limits.maxInterventions}</strong></span>
              <span>Kullanılan bütçe: <strong>{usedBudget}</strong></span>
              <span>Kalan bütçe: <strong>{budget - usedBudget}</strong></span>
            </div>
          </section>
          <fieldset className="reason-fieldset">
            <legend>GEREKÇE SEÇİMİ</legend>
            {waterCrisisScenario.reasons.map((reason) => (
              <label className={state.selectedReason === reason.id ? 'selected' : ''} key={reason.id}>
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={state.selectedReason === reason.id}
                  onChange={() => selectReason(reason.id)}
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="confidence-fieldset">
            <legend>GÜVEN DÜZEYİ</legend>
            <div className="confidence-scale">
              {confidenceValues.map((value) => (
                <label className={state.confidence === value ? 'selected' : ''} key={value}>
                  <input
                    type="radio"
                    name="confidence"
                    value={value}
                    checked={state.confidence === value}
                    onChange={() => setConfidence(value)}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
            <div className="confidence-labels"><span>Çok emin değilim</span><span>Çok eminim</span></div>
          </fieldset>
        </section>
        <aside className="decision-sidebar" aria-labelledby="decision-heading">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="decision-heading" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Planını gözden geçir, neden seçtiğini belirt ve kararını uygula.</p>
            <p className="decision-note">En iyi çözüm, yalnızca tek bir hedefi değil farklı etkileri birlikte dengeleyebilir.</p>
            <h2>BU ADIMDA</h2>
            <ul className="decision-steps">
              <li className="done"><span>✓</span>Planını kontrol et<strong>TAMAM</strong></li>
              <li className={state.selectedReason ? 'done' : ''}><span>{state.selectedReason ? '✓' : '2'}</span>Gerekçeni seç<strong>{state.selectedReason ? 'SEÇİLDİ' : 'BEKLİYOR'}</strong></li>
              <li className={state.confidence ? 'done' : ''}><span>{state.confidence ? '✓' : '3'}</span>Güven düzeyini belirt<strong>{state.confidence ? `${state.confidence} / 5` : 'BEKLİYOR'}</strong></li>
              <li className={ready ? 'active' : ''}><span>4</span>Planı uygula</li>
            </ul>
          </div>
          <div>
            <PrimaryButton onClick={submitPlan} disabled={!ready}>PLANI UYGULA</PrimaryButton>
            {!ready && <p className="decision-requirement">Devam etmek için bir gerekçe ve güven düzeyi seç.</p>}
          </div>
        </aside>
      </main>
    </>
  )
}
