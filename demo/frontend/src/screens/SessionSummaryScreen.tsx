import { useEffect, useRef } from 'react'
import { AppHeader } from '../components/AppHeader.tsx'
import { PrimaryButton } from '../components/PrimaryButton.tsx'
import { useSession } from '../context/sessionContext.ts'

export function SessionSummaryScreen() {
  const { state, completeSession } = useSession()
  const heading = useRef<HTMLHeadingElement>(null)
  const interventionsReviewed = new Set(state.events.flatMap((event) =>
    event.eventType === 'intervention_viewed' && event.target ? [event.target] : [])).size
  const plansCreated = state.events.filter(({ eventType }) => eventType === 'plan_submitted').length
  const strategyChanged = state.events.some(({ eventType }) =>
    eventType === 'strategy_changed' || eventType === 'plan_revised')
  const reflectionCompleted = state.events.some(({ eventType }) => eventType === 'reflection_answered')

  useEffect(() => {
    heading.current?.focus()
  }, [])

  const indicators = [
    { label: 'İncelenen bölgeler', value: `${state.exploredLocations.length} / 5`, unit: 'bölge' },
    { label: 'İncelenen bilgi kaynakları', value: `${state.viewedSources.length} / 6`, unit: 'kaynak' },
    { label: 'Değerlendirilen çözüm seçenekleri', value: String(interventionsReviewed), unit: 'çözüm' },
    { label: 'Oluşturulan plan sayısı', value: String(plansCreated), unit: 'plan' },
    { label: 'Yardım / ipucu kullanımı', value: String(state.hintCount), unit: 'defa' },
    { label: 'Yeni kanıt görüntülendi', value: state.newEvidenceViewed ? 'Evet' : 'Hayır', unit: '' },
    { label: 'Yeni kanıt sonrası strateji değiştirildi', value: strategyChanged ? 'Evet' : 'Hayır', unit: '' },
    { label: 'Reflection tamamlandı', value: reflectionCompleted ? 'Evet' : 'Hayır', unit: '' },
  ]

  return (
    <>
      <AppHeader step={7} />
      <main className="summary-layout">
        <section className="summary-workspace" aria-labelledby="summary-title">
          <div className="summary-heading"><span>OTURUM ÖZETİ</span><p>Süreç ve Etkileşim Analizi</p><strong>ARAŞTIRMA VERİSİ</strong></div>
          <div>
            <h1 id="summary-title" ref={heading} tabIndex={-1}>GÖZLENEN SÜREÇ GÖSTERGELERİ</h1>
            <p className="summary-intro">Bu özet, görev sırasında gözlenen etkileşimleri gösterir.</p>
          </div>
          <div className="indicator-grid">
            {indicators.map((indicator) => (
              <article key={indicator.label}>
                <h2>{indicator.label}</h2>
                <p className={indicator.value === 'Evet' ? 'positive' : ''}><strong>{indicator.value}</strong>{indicator.unit && <span>{indicator.unit}</span>}</p>
              </article>
            ))}
          </div>
          <div className="session-flow">
            <h2>OTURUM AKIŞI</h2>
            <div>
              {['Keşif', 'Bilgi toplama', 'Plan oluşturma', 'Karar', 'Sonuçları inceleme', 'Yeni kanıt', 'Yeniden değerlendirme'].map((step, index) => (
                <span key={step} className={index === 6 ? 'current' : ''}>{index + 1}. {step}</span>
              ))}
            </div>
          </div>
        </section>
        <aside className="summary-sidebar">
          <div>
            <span className="step-label">SÜREÇ YORUMU</span>
            <h2>BU ÖZET NE GÖSTERİYOR?</h2>
            <p className="summary-explanation">Özet, yalnızca hangi sonuca ulaşıldığını değil, probleme nasıl yaklaşıldığına ilişkin gözlenebilir süreç verilerini görünür hale getirir.</p>
            <h3>ÖNEMLİ</h3>
            <ul className="summary-cautions">
              <li>Davranışsal iz, yetkinlik puanı değildir.</li>
              <li>Tek oturum genel yeterliği göstermez.</li>
              <li>Göstergelerin geçerliği ayrıca araştırılmalıdır.</li>
            </ul>
          </div>
          <div>
            <PrimaryButton onClick={completeSession} disabled={state.completed}>
              {state.completed ? 'DEMO TAMAMLANDI' : 'DEMOYU TAMAMLA'}
            </PrimaryButton>
            {state.completed && <p className="completion-status" role="status">Anonim oturum tamamlandı.</p>}
          </div>
        </aside>
        <p className="methodology-statement">Bu göstergeler gözlenen etkileşim süreçlerini tanımlar. Bunlar doğrulanmış yetkinlik puanları değildir.</p>
      </main>
    </>
  )
}
