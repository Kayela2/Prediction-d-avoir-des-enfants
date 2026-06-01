import axios from 'axios'

// En production (même domaine) : URLs relatives.
// En dev : Vite proxy redirige vers localhost:8000 automatiquement.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

// Injecter le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Rediriger vers /login si le token expire (401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
