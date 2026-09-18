import { useEffect, useRef } from 'react'
import type { PlanSummaryData } from '../utils/planSummary.ts'
import { waterCrisisScenario } from '../data/waterCrisisScenario.ts'
import { planningCopy } from '../data/solutions.ts'
import { PrimaryButton } from './PrimaryButton.tsx'

export function PlanConfirmation({ plan, onConfirm, onChange }: { plan: PlanSummaryData; onConfirm: () => void; onChange: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <section className="plan-confirmation" aria-labelledby="plan-confirmation-title">
      <h2 id="plan-confirmation-title" ref={heading} tabIndex={-1}>Planını kontrol et</h2>
      <ul>{plan.selected.map((item) => <li key={item.id}>{item.name} — {item.cost}</li>)}</ul>
      <p><strong>Toplam maliyet: {plan.usedBudget} / {waterCrisisScenario.initialState.budget}</strong></p>
      <p>{planningCopy.confirmation}</p>
      <PrimaryButton onClick={onConfirm}>PLANI ONAYLA</PrimaryButton>
      <button className="plan-change" type="button" onClick={onChange}>DEĞİŞTİR</button>
    </section>
  )
}
