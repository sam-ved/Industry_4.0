// src/pages/EnergyAnalytics.tsx
// Energy Analytics & Prediction Module (Random Forest / XGBoost)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  ArrowLeft,
  Download,
  Loader,
  BarChart3,
  AlertCircle,
  TrendingDown,
} from 'lucide-react'
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { llmAPI, energyAPI } from '../services/api'
import { useBackendStatus } from '../hooks/useBackendStatus'
import ModelInputHandler from '../components/ModelInputHandler'
import BackgroundGlow from '../components/common/BackgroundGlow'
import AIInsightsPanel from '../components/common/AIInsightsPanel'
import { useEffect } from 'react'

interface EnergyResult {
  total_kwh_today: number
  peak_kwh: number
  avg_kwh: number
  efficiency_score: number
  hourly: Array<{ hour: string; kwh: number; co2_kg: number }>
  anomalies: Array<{ hour: string; type: string; kwh: number; deviation_pct: number }>

  llm_insights?: string
}

export default function EnergyAnalytics() {
  const navigate = useNavigate()
  const backendStatus = useBackendStatus()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<EnergyResult | null>(null)
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
          const res = await llmAPI.explain('energy', results as unknown as Record<string, unknown>)
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
      const data = await energyAPI.analyze(selectedFile)
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
              <h1 className="text-2xl font-bold">Energy Analytics</h1>
              <p className="text-sm text-slate-400">ML-based Energy Prediction & Optimization</p>
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
              <h2 className="text-lg font-semibold mb-4">Upload Energy Data</h2>

              <ModelInputHandler
                modelType="energy"
                onFileSelect={handleFileSelect}
                disabled={!backendStatus.isOnline || isLoading}
              />

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading || !backendStatus.isOnline}
                  title="Analyze energy data from the CSV file"
                  className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Analyze Data
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
                <p>timestamp, power_kw, temperature_c, humidity_pct</p>
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
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-2">Total Consumption</p>
                    <p className="text-3xl font-bold text-cyan-400">{results.total_kwh_today}</p>
                    <p className="text-xs text-slate-500 mt-2">kWh</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-2">Peak Load</p>
                    <p className="text-3xl font-bold text-amber-400">{results.peak_kwh}</p>
                    <p className="text-xs text-slate-500 mt-2">kW</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-2">Avg Load</p>
                    <p className="text-3xl font-bold text-emerald-400">{results.avg_kwh}</p>
                    <p className="text-xs text-slate-500 mt-2">kW</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm text-slate-400 mb-2">Efficiency Score</p>
                    <p className="text-3xl font-bold text-blue-400">{results.efficiency_score}%</p>
                  </div>
                </div>

                {/* Hourly Chart */}
                {results.hourly && results.hourly.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm font-semibold mb-4">Power Trend</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.hourly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="hour" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569' }} />
                        <Line
                          type="monotone"
                          dataKey="kwh"
                          stroke="#06B6D4"
                          dot={false}
                          isAnimationActive={true}
                          name="Usage (kWh)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Anomalies */}
                {results.anomalies && results.anomalies.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <TrendingDown className="text-amber-400" size={16} />
                      Anomalies Detected
                    </p>
                    <ul className="space-y-2">
                      {results.anomalies.map((anom, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex gap-3">
                          <span className="text-amber-400 flex-shrink-0">!</span>
                          <span>At {anom.hour}, a {anom.type} of {anom.kwh} kWh ({anom.deviation_pct}% deviation) was detected.</span>
                        </li>
                      ))}
                    </ul>
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
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-center h-96 text-center">
                <div>
                  <BarChart3 size={48} className="mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Upload CSV data and click Analyze Data</p>
                  <p className="text-xs text-slate-500 mt-2">to see analytics and predictions</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
