import { create } from 'zustand'
import { api } from '../lib/api'
import type { User, Simulation, SimulationData, PredictionResult } from '../types'

// Mapping label → code numérique (instruction reste inchangé)
export const INSTRUCTION_MAP: Record<string, number> = {
  aucun: 0, primaire: 1, secondaire: 2, superieur: 3,
}

const ICONS = ['🏙️', '🌿', '📚', '🏡', '💫', '🌟', '🔬', '🌍']

interface SimPayload {
  title: string
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSimulation(s: any): Simulation {
  return {
    id:               s.id,
    user_id:          s.user_id,
    title:            s.title,
    createdAt:        s.created_at,
    status:           s.status ?? 'completed',
    confidence:       s.confidence,
    icon:             ICONS[Math.abs(s.id.charCodeAt(0)) % ICONS.length],
    age:              s.age,
    instruction:      s.instruction,
    nb_enfants:       s.nb_enfants,
    nb_enfants_deces: s.nb_enfants_deces ?? 0,
    contracep_trad:   s.contracep_trad ?? 0,
    contracep_moderne:s.contracep_moderne ?? 0,
    mariee:           s.mariee ?? 0,
    union_libre:      s.union_libre ?? 0,
    veuve:            s.veuve ?? 0,
    divorcee:         s.divorcee ?? 0,
    separee:          s.separee ?? 0,
    residence_rural:  s.residence_rural ?? 0,
    quintile:         s.quintile,
    emploi:           s.emploi ?? 0,
    region_nord:      s.region_nord ?? 0,
    rel_protestant:   s.rel_protestant ?? 0,
    rel_autres_chret: s.rel_autres_chret ?? 0,
    rel_musulman:     s.rel_musulman ?? 0,
    rel_autres:       s.rel_autres ?? 0,
    desire_enfant:    s.desire_enfant,
    probability:      s.probability,
    model_used:       s.model_used,
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
  authChecked: boolean   // true une fois la vérification initiale du token terminée

  setUser: (user: User | null) => void
  setSimData: (data: Partial<SimulationData>) => void
  setCurrentStep: (step: number) => void
  setPredictionResult: (r: PredictionResult | null) => void
  setAuthError: (err: string | null) => void
  resetSim: () => void

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, sexe?: string) => Promise<void>
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
  authChecked: false,

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

  register: async (name, email, password, sexe) => {
    set({ authLoading: true, authError: null })
    try {
      await api.post('/auth/register', { name, email, password, sexe: sexe ?? null })
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
          sexe:  data.sexe ?? null,
          plan:  data.plan ?? 'free',
        },
      })
    } catch {
      localStorage.removeItem('token')
      set({ user: null })
    } finally {
      set({ authChecked: true })
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
