import { create } from 'zustand'
import { api } from '../lib/api'
import type { User, Simulation, SimulationData, PredictionResult } from '../types'

// Mappings label → code numérique pour le backend
export const INSTRUCTION_MAP: Record<string, number> = {
  aucun: 0, primaire: 1, secondaire: 2, superieur: 3,
}
export const MILIEU_MAP: Record<string, number> = {
  urbain: 1, rural: 2,
}
const ICONS = ['🏙️', '🌿', '📚', '🏡', '💫', '🌟', '🔬', '🌍']

interface SimPayload {
  title: string
  age: number
  niveau_instruction: number
  nb_enfants_vivants: number
  contraceptif: number
  statut_matrimonial: number
  milieu_residence: number
  quintile_richesse: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSimulation(s: any): Simulation {
  return {
    id:                s.id,
    user_id:           s.user_id,
    title:             s.title,
    createdAt:         s.created_at,
    status:            s.status ?? 'completed',
    confidence:        s.confidence,
    icon:              ICONS[Math.abs(s.id.charCodeAt(0)) % ICONS.length],
    age:               s.age,
    niveau_instruction:s.niveau_instruction,
    nb_enfants_vivants:s.nb_enfants_vivants,
    contraceptif:      s.contraceptif,
    statut_matrimonial:s.statut_matrimonial,
    milieu_residence:  s.milieu_residence,
    quintile_richesse: s.quintile_richesse,
    desire_enfant:     s.desire_enfant,
    probability:       s.probability,
    model_used:        s.model_used,
  }
}

interface AppState {
  user: User | null
  simulations: Simulation[]
  currentSimData: Partial<SimulationData>
  currentStep: number
  predictionResult: PredictionResult | null
  authLoading: boolean
  authError: string | null

  setUser: (user: User | null) => void
  setSimData: (data: Partial<SimulationData>) => void
  setCurrentStep: (step: number) => void
  setPredictionResult: (r: PredictionResult | null) => void
  setAuthError: (err: string | null) => void
  resetSim: () => void

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  fetchSimulations: () => Promise<void>
  createSimulation: (payload: SimPayload) => Promise<Simulation>
  deleteSimulation: (id: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  simulations: [],
  currentSimData: {},
  currentStep: 0,
  predictionResult: null,
  authLoading: false,
  authError: null,

  setUser: (user) => set({ user }),
  setSimData: (data) => set((s) => ({ currentSimData: { ...s.currentSimData, ...data } })),
  setCurrentStep: (step) => set({ currentStep: step }),
  setPredictionResult: (r) => set({ predictionResult: r }),
  setAuthError: (err) => set({ authError: err }),
  resetSim: () => set({ currentSimData: {}, currentStep: 0, predictionResult: null }),

  login: async (email, password) => {
    set({ authLoading: true, authError: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      await get().fetchUser()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        'Email ou mot de passe incorrect'
      set({ authError: msg })
      throw err
    } finally {
      set({ authLoading: false })
    }
  },

  register: async (name, email, password) => {
    set({ authLoading: true, authError: null })
    try {
      await api.post('/auth/register', { name, email, password })
      // Connexion automatique après inscription
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      await get().fetchUser()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        'Inscription échouée'
      set({ authError: msg })
      throw err
    } finally {
      set({ authLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, simulations: [], predictionResult: null })
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/users/me')
      set({
        user: {
          id:    data.id,
          name:  data.name,
          email: data.email,
          plan:  data.plan ?? 'free',
        },
      })
    } catch {
      localStorage.removeItem('token')
    }
  },

  fetchSimulations: async () => {
    try {
      const { data } = await api.get('/simulations')
      set({ simulations: data.map(mapSimulation) })
    } catch {
      // pas authentifié — ne pas bloquer l'UI
    }
  },

  createSimulation: async (payload) => {
    const { data } = await api.post('/simulations', payload)
    const sim = mapSimulation(data)
    set((s) => ({ simulations: [sim, ...s.simulations] }))
    return sim
  },

  deleteSimulation: async (id) => {
    await api.delete(`/simulations/${id}`)
    set((s) => ({ simulations: s.simulations.filter((x) => x.id !== id) }))
  },
}))
