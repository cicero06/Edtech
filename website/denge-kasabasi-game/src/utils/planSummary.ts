import { waterCrisisScenario as scenario } from '../data/waterCrisisScenario.ts'
import { solutions } from '../data/solutions.ts'
import type { InterventionId } from '../types/scenario.ts'

export function summarizePlan(ids: readonly InterventionId[], revisionCount = 0) {
  const selected = scenario.interventions.filter(({ id }) => ids.includes(id))
  const usedBudget = selected.reduce((total, item) => total + item.cost, 0)
  const metadata = selected.map(({ id }) => solutions[id])
  const waterDelta = selected.reduce((total, item) => total +
    (revisionCount > 0 && item.id === 'rainwater-harvesting' ? item.revisedWaterDelta : item.waterDelta), 0)
  const agricultureRisk = selected.some((item) => item.agricultureImpact === 'negative')
  const environmentalUncertainty = metadata.some((item) => item.environmentRisk === 'uncertain')
  const environmentalRisk = metadata.some((item) => item.environmentRisk === 'medium')
  const unspecifiedRisk = metadata.some((item) => item.environmentRisk === 'unspecified')
  const longTermBenefit = metadata.some((item) => item.longTermBenefit)
  const environment = selected.length === 0 ? 'Henüz seçim yok' : [
    environmentalRisk ? 'Orta risk' : !unspecifiedRisk && !environmentalUncertainty ? 'Düşük risk' : '',
    environmentalUncertainty ? 'Uzun vadede belirsizlik var' : '',
    unspecifiedRisk ? 'Bazı etkiler için ek değerlendirme gerekli' : '',
  ].filter(Boolean).join(' · ')
  return {
    selected, usedBudget, remainingBudget: scenario.initialState.budget - usedBudget,
    waterDelta: Math.min(100 - scenario.initialState.water, waterDelta),
    agricultureRisk, environmentalUncertainty, environmentalRisk, longTermBenefit, environment,
  }
}

export type PlanSummaryData = ReturnType<typeof summarizePlan>
