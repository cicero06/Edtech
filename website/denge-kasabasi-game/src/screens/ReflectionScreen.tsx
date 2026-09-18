import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { InterventionId } from '../types/scenario.ts'

export function ReflectionScreen() {
  const { state, setUnexpectedResult, setWantsRevision, submitReflection } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const firstPlanEvent = state.events.find(({ eventType }) => eventType === 'plan_submitted')
  const firstPlanIds = Array.isArray(firstPlanEvent?.value)
    ? firstPlanEvent.value.filter((id): id is InterventionId =>
        typeof id === 'string' && waterCrisisScenario.interventions.some((item) => item.id === id))
    : []
  const firstPlan = firstPlanIds.map((id) =>
    waterCrisisScenario.interventions.find((intervention) => intervention.id === id)!).filter(Boolean)
  const usedBudget = firstPlan.reduce((total, intervention) => total + intervention.cost, 0)
  const waterDelta = firstPlan.reduce((total, intervention) => total + intervention.waterDelta, 0)
  const water = Math.min(100, Math.max(0, waterCrisisScenario.initialState.water + waterDelta))
  const ready = state.reflectionUnexpectedResult !== null && state.wantsRevision !== null

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <>
      <AppHeader step={7} showResources water={water} budget={waterCrisisScenario.initialState.budget - usedBudget} />
      <main className="reflection-layout">
        <section className="reflection-workspace" aria-labelledby="reflection-content-title">
          
          <div className="reflection-heading"><span>YANSITMA &amp; YENİDEN DEĞERLENDİRME</span><p>Sonuçları ve yeni bulguları değerlendirerek kararını gözden geçir.</p></div>
          <h2 id="reflection-content-title">PLANINI YENİDEN DEĞERLENDİR</h2>
          <div className="reflection-plan"><strong>İLK PLANIN:</strong><div>{firstPlan.length > 0
            ? firstPlan.map((intervention) => <span key={intervention.id}>{intervention.name}</span>)
            : <span>Müdahale seçilmedi</span>}
          </div></div>
          <section className="reflection-evidence" aria-label="Yeni bilgi">
            <span>YENİ BİLGİ</span>
            <strong>{waterCrisisScenario.newEvidence.text}</strong>
            <p>Bu bilgi yağmur suyu toplama sisteminin kısa vadeli etkisini değiştirebilir.</p>
          </section>
          <fieldset className="reflection-question">
            <legend>1. Beklemediğin bir sonuç veya yeni bilgi oldu mu?</legend>
            <div className="binary-options">
              <button type="button" className={state.reflectionUnexpectedResult === true ? 'selected' : ''} aria-pressed={state.reflectionUnexpectedResult === true} onClick={() => setUnexpectedResult(true)}>Evet</button>
              <button type="button" className={state.reflectionUnexpectedResult === false ? 'selected' : ''} aria-pressed={state.reflectionUnexpectedResult === false} onClick={() => setUnexpectedResult(false)}>Hayır</button>
            </div>
          </fieldset>
          <fieldset className="reflection-question">
            <legend>2. Yeni bilgi kararını etkiledi mi?</legend>
            <div className="revision-options">
              <button type="button" className={state.wantsRevision === true ? 'selected' : ''} aria-pressed={state.wantsRevision === true} onClick={() => setWantsRevision(true)}><span>Evet, planımı değiştirmek istiyorum.</span><small>Farklı müdahaleleri dene</small></button>
              <button type="button" className={state.wantsRevision === false ? 'selected' : ''} aria-pressed={state.wantsRevision === false} onClick={() => setWantsRevision(false)}><span>Hayır, mevcut planımı koruyorum.</span><small>Mevcut planla devam et</small></button>
            </div>
          </fieldset>
          <p className="reflection-footer-note">Yeni bir kanıt geldiğinde önceki kararını yeniden düşünmek, kararının yanlış olduğu anlamına gelmez.</p>
        </section>
        <aside className="reflection-sidebar" aria-labelledby="reflection-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="reflection-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Sonuçları ve yeni bilgiyi düşünerek ilk kararını yeniden değerlendir.</p>
            <p className="reflection-note">Kararını değiştirmek de korumak da mümkündür. Önemli olan yeni bilgiyi dikkate almaktır.</p>
            <h2>DÜŞÜN</h2>
            <ol className="reflection-prompts">
              <li>Beklediğin sonuç neydi?</li>
              <li>Gerçekte ne oldu?</li>
              <li>Yeni bilgi önemli mi?</li>
              <li>Planını değiştirmek gerekiyor mu?</li>
            </ol>
          </div>
          <div>
            <PrimaryButton onClick={submitReflection} disabled={!ready}>DEĞERLENDİRMEYİ TAMAMLA</PrimaryButton>
            {!ready && <p className="decision-requirement">Devam etmek için iki soruyu da yanıtla.</p>}
          </div>
        </aside>
      </main>
    </>
  )
}
