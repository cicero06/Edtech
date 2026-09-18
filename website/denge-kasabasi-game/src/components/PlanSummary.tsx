import { waterCrisisScenario as scenario } from '../data/waterCrisisScenario.ts'
import { planningCopy } from '../data/solutions.ts'
import type { PlanSummaryData } from '../utils/planSummary.ts'

export function PlanSummary({ plan }: { plan: PlanSummaryData }) {
  return (
    <section className="plan-summary" aria-label="Seçilen plan özeti">
      <strong>PLANIN</strong>
      <div><span>Toplam bütçe: <b>{scenario.initialState.budget}</b></span><span>Seçilen çözüm: <b>{plan.selected.length} / {scenario.limits.maxInterventions}</b></span></div>
      <div><span>Kullanılan bütçe: <b>{plan.usedBudget} / {scenario.initialState.budget}</b></span><span>Kalan bütçe: <b>{plan.remainingBudget}</b></span></div>
      <progress aria-label="Kullanılan bütçe" max={scenario.initialState.budget} value={plan.usedBudget} />
      <ul className="plan-effects">
        <li>💧 Tahmini su etkisi: {plan.selected.length ? `+${plan.waterDelta} yüzde puan` : 'Henüz seçim yok'}</li>
        <li>🌾 Tarım riski: {plan.agricultureRisk ? 'Ürün verimi azalabilir' : plan.selected.length ? 'Seçilen çözümlerde belirtilmiş ek risk yok' : 'Henüz seçim yok'}</li>
        <li>🌳 Çevresel risk: {plan.environment}</li>
        <li>🔮 Uzun vadeli fayda: {plan.longTermBenefit ? 'Yüksek fayda potansiyeli olan çözüm var' : 'Belirtilmiş uzun vadeli fayda yok'}</li>
      </ul>
      <p className="plan-estimate-note">{planningCopy.estimateNote}</p>
    </section>
  )
}
