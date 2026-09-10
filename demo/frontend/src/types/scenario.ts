export type LocationId = 'dam' | 'homes' | 'agriculture' | 'park' | 'municipality'

export type SourceId =
  | 'municipality_engineer'
  | 'farmer'
  | 'environmental_expert'
  | 'water_usage'
  | 'social_media'
  | 'municipality_budget'

export type InterventionId =
  | 'network-leak-repair'
  | 'reduce-agricultural-irrigation'
  | 'reduce-park-irrigation'
  | 'rainwater-harvesting'
  | 'new-well'

export type ReasonId = 'water-saving' | 'budget-balance' | 'environment' | 'multiple-problems' | 'other'

export interface ScenarioLocation {
  id: LocationId
  name: string
}

export interface EvidenceSource {
  id: SourceId
  name: string
  type: 'Uzman görüşü' | 'Paydaş görüşü' | 'Veri / grafik' | 'Doğrulanmamış iddia' | 'Resmî veri'
  evidenceType?: string
  content?: string
}

export interface Intervention {
  id: InterventionId
  name: string
  cost: number
  waterDelta: number
  revisedWaterDelta?: number
  agricultureImpact: 'neutral' | 'negative'
  environmentalDescription: string
}

export interface ReasonOption {
  id: ReasonId
  label: string
}

export interface Scenario {
  id: 'water-crisis'
  name: string
  targetAge: { min: number; max: number }
  initialState: { water: number; budget: number }
  limits: { maxInterventions: number; maxRevisions: number }
  intro: {
    brand: string
    subtitle: string
    description: string
    mission: string
    cta: string
    footnote: string
  }
  locations: readonly ScenarioLocation[]
  sources: readonly EvidenceSource[]
  interventions: readonly Intervention[]
  reasons: readonly ReasonOption[]
  waterUseDistribution: readonly { name: string; percentage: number }[]
  newEvidence: {
    id: string
    text: string
    affectedInterventionId: InterventionId
  }
}
