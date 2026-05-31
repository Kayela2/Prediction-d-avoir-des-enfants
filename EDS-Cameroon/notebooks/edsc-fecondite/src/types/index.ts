export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'premium'
}

export type Milieu      = 'urbain' | 'rural'
export type Instruction = 'aucun' | 'primaire' | 'secondaire' | 'superieur'
export type Quintile    = 1 | 2 | 3 | 4 | 5

export interface SimulationData {
  age: number
  milieu: Milieu
  instruction: Instruction
  nbEnfants: number
  quintile: Quintile
  statutMatrimonial: number  // 1-5
  contraceptif: number       // 0 ou 1
}

// Simulation telle que retournée par le backend (snake_case converti)
export interface Simulation {
  id: string
  user_id: string
  title: string
  createdAt: string
  status: 'active' | 'archived' | 'completed'
  confidence: number | null
  icon: string
  age: number
  niveau_instruction: number
  nb_enfants_vivants: number
  contraceptif: number
  statut_matrimonial: number
  milieu_residence: number
  quintile_richesse: number
  desire_enfant: boolean | null
  probability: number | null
  model_used: string | null
}

export interface PredictionResult {
  // Données saisies (pour l'affichage dans ResultsPage)
  age: number
  instruction: Instruction
  milieu: Milieu
  nbEnfants: number
  quintile: number
  // Résultat de la prédiction
  confidence: number
  desireEnfant: boolean
  probability: number
  insights: string[]
  featureImportances?: Record<string, number>
}
