// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DefectDetection from './pages/DefectDetection'
import PPEMonitoring from './pages/PPEMonitoring'
import EnergyAnalytics from './pages/EnergyAnalytics'
import PredictiveMaintenance from './pages/PredictiveMaintenance'
import ModelsHub from './pages/ModelsHub'
import MLStudio from './pages/MLStudio'
import FineTuning from './pages/FineTuning'
import SimulationDashboard from './pages/SimulationDashboard'
import AIReasoning from './pages/AIReasoning'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import { initAnalytics, trackPageView } from './utils/analytics'
import './App.css'

// Route change tracker for analytics
function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])
  return null
}

function App() {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <Router>
      <RouteTracker />
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Module Routes */}
        <Route path="/steel-defect" element={<DefectDetection />} />
        <Route path="/ppe-monitoring" element={<PPEMonitoring />} />
        <Route path="/energy-analytics" element={<EnergyAnalytics />} />
        <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
        <Route path="/simulation" element={<SimulationDashboard />} />

        {/* Models Hub */}
        <Route path="/models" element={<ModelsHub />} />
        <Route path="/ml-studio" element={<MLStudio />} />
        <Route path="/finetuning" element={<FineTuning />} />

        {/* AI Reasoning */}
        <Route path="/ai-reasoning" element={<AIReasoning />} />

        {/* Legal */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

