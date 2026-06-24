import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage     from './pages/LandingPage'
import AuthPage        from './pages/AuthPage'
import OnboardingPage  from './pages/OnboardingPage'
import DashboardPage   from './pages/DashboardPage'
import HistoryPage     from './pages/HistoryPage'
import ResultsPage     from './pages/ResultsPage'
import AlertesPage     from './pages/AlertesPage'
import ReglagesPage    from './pages/ReglagesPage'
import DashboardLayout from './components/layout/DashboardLayout'
import { useStore }    from './store/useStore'

function AppInit({ children }: { children: React.ReactNode }) {
  const fetchUser = useStore((s) => s.fetchUser)

  useEffect(() => {
    // Restaurer la session si un token existe en localStorage,
    // sinon marquer la vérification d'auth comme terminée.
    if (localStorage.getItem('token')) fetchUser()
    else useStore.setState({ authChecked: true })
  }, [fetchUser])

  return <>{children}</>
}

// Garde d'accès : empêche de voir les pages de prédiction/résultats sans être authentifié
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user        = useStore((s) => s.user)
  const authChecked = useStore((s) => s.authChecked)

  // Tant que la vérification du token n'est pas terminée, on patiente (évite de
  // rediriger à tort un utilisateur déjà connecté pendant le chargement initial).
  if (!authChecked) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#070B18' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid rgba(99,102,241,0.25)', borderTopColor:'#6366F1', animation:'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<AuthPage />} />
          <Route path="/simulation" element={<OnboardingPage />} />
          <Route path="/dashboard"  element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index                element={<DashboardPage />} />
            <Route path="historique"    element={<HistoryPage />} />
            <Route path="alertes"       element={<AlertesPage />} />
            <Route path="reglages"      element={<ReglagesPage />} />
            <Route path="resultats/:id" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  )
}
