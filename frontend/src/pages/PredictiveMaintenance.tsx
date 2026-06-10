// src/pages/PredictiveMaintenance.tsx
// Predictive Maintenance Module
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wrench,
  ArrowLeft,
  Download,
  Loader,
  BarChart3,
  AlertCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { llmAPI, maintenanceAPI } from '../services/api'
import { useBackendStatus } from '../hooks/useBackendStatus'
import ModelInputHandler from '../components/ModelInputHandler'
import BackgroundGlow from '../components/common/BackgroundGlow'
import AIInsightsPanel from '../components/common/AIInsightsPanel'
import { useEffect } from 'react'

interface MaintenanceResult {
  failure_risk: number
  days_until_failure: number
  components_at_risk: Array<{
    name: string
    risk_score: number
    recommended_action: string
  }>
  maintenance_schedule: Array<{
    component: string
    due_date: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }>
  health_status: 'healthy' | 'warning' | 'critical'
  llm_insights?: string
}

const COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#FBBF24',
  low: '#10B981',
}

export default function PredictiveMaintenance() {
  const navigate = useNavigate()
  const backendStatus = useBackendStatus()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MaintenanceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  useEffect(() => {
    if (results) {
      const fetchInsights = async () => {
        setInsightsLoading(true)
        setInsightsError('')
        try {
          const res = await llmAPI.explain('maintenance', results as Record<string, unknown>)
          setInsights(res.explanation)
        } catch (err) {
          setInsightsError('Failed to load AI Insights.')
        } finally {
          setInsightsLoading(false)
        }
      }
      fetchInsights()
    } else {
      setInsights(null)
    }
  }, [results])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResults(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first')
      return
    }

    if (!backendStatus.isOnline) {
      setError('Backend is offline. Please try again later.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await maintenanceAPI.analyze(selectedFile)
      setResults(data.data || data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setResults(null)
    setError(null)
  }

  // Pie chart data
  const pieData =
    results?.components_at_risk?.map((c) => ({
      name: c.name,
      value: c.risk_score * 100,
    })) || []

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BackgroundGlow />

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              title="Go back to dashboard"
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Predictive Maintenance</h1>
              <p className="text-sm text-slate-400">ML-based Equipment Failure Prediction</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
            <div
              className={`w-2 h-2 rounded-full ${
                backendStatus.isOnline ? 'bg-emerald-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm">
              {backendStatus.isOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-semibold mb-4">Upload Sensor Data</h2>

              <ModelInputHandler
                modelType="predictive"
                onFileSelect={handleFileSelect}
                disabled={!backendStatus.isOnline || isLoading}
              />

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading || !backendStatus.isOnline}
                  title="Predict equipment failure and maintenance needs"
                  className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wrench size={18} />
                      Predict
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  title="Clear the selected file and results"
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
                >
                  Clear
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* CSV Format Guide */}
              <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Expected CSV Format:</p>
                <p>timestamp, vibration, temperature, runtime_hours, failures</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 lg:col-span-2 space-y-6"
          >
            {results ? (
              <>
                {/* Health Status */}
                <div
                  className={`bg-gradient-to-br rounded-xl p-6 border ${
                    results.health_status === 'critical'
                      ? 'from-red-500/20 to-red-500/5 border-red-500/50'
                      : results.health_status === 'warning'
                        ? 'from-amber-500/20 to-amber-500/5 border-amber-500/50'
                        : 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/50'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Failure Risk */}
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Failure Risk</p>
                      <p className="text-4xl font-bold text-red-400">
                        {(results.failure_risk * 100).toFixed(1)}%
                      </p>
                      <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          // eslint-disable-next-line @stylistic/no-restricted-syntax
                          className="bg-red-500 h-full transition-all duration-500"
                          style={{ width: `${results.failure_risk * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Days Until Failure */}
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Days Until Failure</p>
                      <p className="text-4xl font-bold text-amber-400">
                        {results.days_until_failure}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">days remaining</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-slate-400 mb-2">System Health</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            results.health_status === 'critical'
                              ? 'bg-red-500'
                              : results.health_status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                        <p className="text-lg font-semibold capitalize">{results.health_status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Components at Risk */}
                {results.components_at_risk && results.components_at_risk.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <p className="text-sm font-semibold mb-4">Risk Distribution</p>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        Components at Risk
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {results.components_at_risk.map((comp, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/50 p-3 rounded border border-slate-700 text-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{comp.name}</span>
                              <span
                                // eslint-disable-next-line @stylistic/no-restricted-syntax
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  background: `${COLORS[comp.risk_score > 0.7 ? 'critical' : comp.risk_score > 0.5 ? 'high' : comp.risk_score > 0.3 ? 'medium' : 'low']}33`,
                                  color: COLORS[comp.risk_score > 0.7 ? 'critical' : comp.risk_score > 0.5 ? 'high' : comp.risk_score > 0.3 ? 'medium' : 'low'],
                                }}
                              >
                                {(comp.risk_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{comp.recommended_action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Maintenance Schedule */}
                {results.maintenance_schedule && results.maintenance_schedule.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm font-semibold mb-4">Maintenance Schedule</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {results.maintenance_schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm bg-slate-800/50 p-3 rounded"
                        >
                          <div>
                            <p className="font-medium">{item.component}</p>
                            <p className="text-xs text-slate-500">{item.due_date}</p>
                          </div>
                          <span
                            // eslint-disable-next-line @stylistic/no-restricted-syntax
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: `${COLORS[item.priority]}33`,
                              color: COLORS[item.priority],
                            }}
                          >
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insights Panel */}
                <AIInsightsPanel 
                  isLoading={insightsLoading} 
                  insights={insights} 
                  error={insightsError} 
                />

                <button
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export Report
                </button>
              </>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-center h-96 text-center col-span-2">
                <div>
                  <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Upload sensor data and click Predict</p>
                  <p className="text-xs text-slate-500 mt-2">to see maintenance predictions</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
