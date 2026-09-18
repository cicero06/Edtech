import type { SourceId } from './scenario.ts'

export interface SolutionDetailData {
  description: string
  benefits: readonly string[]
  risks: readonly string[]
  labels: readonly string[]
  characterSource: 'municipality_engineer' | 'farmer' | 'environmental_expert'
  comment: string
  evidenceLinks: readonly SourceId[]
  environmentRisk: 'low' | 'medium' | 'unspecified' | 'uncertain'
  longTermBenefit: boolean
}
