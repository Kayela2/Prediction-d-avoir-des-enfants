export interface User {
  id: string
  name: string
  email: string
  sexe: 'homme' | 'femme' | null
  avatar?: string
  plan: 'free' | 'premium'
}

export type Milieu      = 'urbain' | 'rural'
export type Instruction = 'aucun' | 'primaire' | 'secondaire' | 'superieur'
export type Quintile    = 1 | 2 | 3 | 4 | 5

// 0=Aucun 1=Trad 2=Moderne
export type ContraceptifType = 0 | 1 | 2

export interface SimulationData {
  age: number
  milieu: Milieu
  instruction: Instruction
  nbEnfants: number
  quintile: Quintile
  statutMatrimonial: number  // 0=Jamais mariée 1=Mariée 2=Union libre 3=Veuve 4=Divorcée 5=Séparée
  contraceptifType: ContraceptifType
  emploi: number             // 0=Non 1=Oui
  regionNord: number         // 0 ou 1
  religionCode: number       // code brut v130 (1-6, 0=non renseigné)
}

// Simulation telle que retournée par le backend (encodage corrigé EDSC-V)
export interface Simulation {
  id: string
  user_id: string
  title: string
  createdAt: string
  status: 'active' | 'archived' | 'completed'
  confidence: number | null
  icon: string
  age: number
  instruction: number
  nb_enfants: number
  nb_enfants_deces: number
  contracep_trad: number
  contracep_moderne: number
  mariee: number
  union_libre: number
  veuve: number
  divorcee: number
  separee: number
  residence_rural: number
  quintile: number
  emploi: number
  region_nord: number
  rel_protestant: number
  rel_autres_chret: number
  rel_musulman: number
  rel_autres: number
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
