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
    // Restaurer la session si un token existe en localStorage
    if (localStorage.getItem('token')) fetchUser()
  }, [fetchUser])

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
          <Route path="/dashboard"  element={<DashboardLayout />}>
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
