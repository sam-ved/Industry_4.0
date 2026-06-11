// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DefectDetection from './pages/DefectDetection'
import PPEMonitoring from './pages/PPEMonitoring'
import EnergyAnalytics from './pages/EnergyAnalytics'
import PredictiveMaintenance from './pages/PredictiveMaintenance'
import ModelsHub from './pages/ModelsHub'
import MLStudio from './pages/MLStudio'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Module Routes */}
        <Route path="/steel-defect" element={<DefectDetection />} />
        <Route path="/ppe-monitoring" element={<PPEMonitoring />} />
        <Route path="/energy-analytics" element={<EnergyAnalytics />} />
        <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />

        {/* Models Hub */}
        <Route path="/models" element={<ModelsHub />} />
        <Route path="/ml-studio" element={<MLStudio />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
