import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import type { InterventionId } from '../types/scenario.ts'

const environmentEffects: Record<InterventionId, string> = {
  'network-leak-repair': 'Çevresel risk düşük.',
  'reduce-agricultural-irrigation': 'Ek sayısal çevre skoru üretilmedi.',
  'reduce-park-irrigation': 'Orta düzey çevresel ödünleşim bulunuyor.',
  'rainwater-harvesting': 'Uzun vadeli çevresel fayda yüksek.',
  'new-well': 'Uzun vadeli çevresel sonuç belirsiz.',
}

export function OutcomeScreen() {
  const { state, viewOutcome, viewNewEvidence, continueFromOutcome } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const isFinal = state.revisionCount === 1
  const interventions = state.selectedInterventions.map((id) =>
    waterCrisisScenario.interventions.find((intervention) => intervention.id === id)!).filter(Boolean)
  const usedBudget = interventions.reduce((total, intervention) => total + intervention.cost, 0)
  const waterDelta = interventions.reduce((total, intervention) =>
    total + (isFinal && intervention.id === 'rainwater-harvesting'
      ? intervention.revisedWaterDelta ?? intervention.waterDelta
      : intervention.waterDelta), 0)
  const finalWater = Math.min(100, Math.max(0, waterCrisisScenario.initialState.water + waterDelta))
  const agricultureImpact = state.selectedInterventions.includes('reduce-agricultural-irrigation')
    ? 'Tarımsal üretim üzerinde olumsuz etki olabilir.'
    : 'Seçilen müdahaleler için ek sayısal tarım skoru üretilmedi.'

  useEffect(() => {
    heading.current?.focus()
    viewOutcome()
    viewNewEvidence()
  }, [viewOutcome, viewNewEvidence])

  return (
    <>
      <AppHeader step={6} showResources water={finalWater} budget={waterCrisisScenario.initialState.budget - usedBudget} />
      <main className="outcome-layout">
        <section className="outcome-workspace" aria-labelledby="outcome-results-title">
          <div className="story-identity-card" aria-label="Oyuncu özeti">
            <span className="story-identity-avatar" aria-hidden="true">🧑‍🌾</span>
            <div>
              <strong>Arda</strong>
              <small>Kasaba Mühendisi</small>
            </div>
          </div>
          <div className="outcome-heading">
            <div><span>SONUÇLAR &amp; YENİ BİLGİ</span><p>Uygulanan planın kasabadaki etkilerini ve yeni bulguları incele.</p></div>
            <strong>{isFinal ? 'FİNAL SONUÇ' : 'DÖNEM 1 SONUÇLARI'}</strong>
          </div>
          <h2 id="outcome-results-title">PLANININ SONUÇLARI</h2>
          <div className="applied-plan">
            <strong>UYGULANAN PLAN:</strong>
            <div>{interventions.length > 0
              ? interventions.map((intervention) => <span key={intervention.id}>{intervention.name}</span>)
              : <span>Müdahale seçilmedi</span>}
            </div>
            <small>{interventions.length} / {waterCrisisScenario.limits.maxInterventions} Müdahale</small>
          </div>
          <div className="outcome-grid">
            <article className="water-outcome">
              <div><h3>SU DURUMU</h3><strong>+{waterDelta} yüzde puan</strong></div>
              <p>Önce: <b>%{waterCrisisScenario.initialState.water}</b><span>→ Sonra: <b>%{finalWater}</b></span></p>
            </article>
            <article className="budget-outcome">
              <div><h3>BÜTÇE</h3><strong>−{usedBudget}</strong></div>
              <p>Önce: <b>{waterCrisisScenario.initialState.budget}</b><span>→ Sonra: <b>{waterCrisisScenario.initialState.budget - usedBudget}</b></span></p>
            </article>
            <article>
              <div><h3>TARIM</h3><strong>Nitel gözlem</strong></div>
              <p>{agricultureImpact}</p>
            </article>
            <article>
              <div><h3>ÇEVRE</h3><strong>Nitel gözlem</strong></div>
              {interventions.length > 0 ? (
                <ul>{interventions.map((intervention) => <li key={intervention.id}>{environmentEffects[intervention.id]}</li>)}</ul>
              ) : <p>Seçili müdahale bulunmuyor.</p>}
            </article>
          </div>
          <section className="new-evidence" aria-label="Yeni bilgi">
            <span>{isFinal ? 'DİKKATE ALINAN YENİ BİLGİ' : 'YENİ BİLGİ'}</span>
            <strong>{waterCrisisScenario.newEvidence.text}</strong>
            <p>Yağmur suyu toplama sisteminin kısa vadede beklenenden daha az su sağlaması mümkün olabilir.</p>
          </section>
        </section>
        <aside className="outcome-sidebar" aria-labelledby="outcome-title">
          <div>
            <span className="step-label">GÖREV ADIMI</span>
            <h1 id="outcome-title" ref={heading} tabIndex={-1}>GÖREV</h1>
            <p className="task-lead">Planının sonuçlarını incele ve yeni bilginin kararını etkileyip etkilemediğini düşün.</p>
            <p className="outcome-note">Bir çözümün kısa vadede iyi görünmesi, uzun vadede her zaman iyi olduğu anlamına gelmeyebilir.</p>
            <h2>İNCELE</h2>
            <ol className="outcome-prompts">
              <li>Su durumu nasıl değişti?</li>
              <li>Bütçe ne kadar kullanıldı?</li>
              <li>Diğer alanlarda ne oldu?</li>
              <li>Yeni bilgi planını etkiliyor mu?</li>
            </ol>
          </div>
          <PrimaryButton onClick={continueFromOutcome}>
            {isFinal ? 'OTURUM ÖZETİNİ GÖR' : 'SONUÇLARI DEĞERLENDİR'}
          </PrimaryButton>
        </aside>
      </main>
    </>
  )
}
