// frontend/src/hooks/useModelsHub.js
// Business logic hook for Models Hub feature

import { useState, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useModelsHub() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [file, setFile] = useState(null)
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)

  // Fetch available models
  const fetchModels = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`${BASE}/api/models/list`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setModels(data.models || [])
    } catch (err) {
      setError(err.message)
      console.error('[useModelsHub] Failed to fetch models:', err)
    }
  }, [])

  // Fetch analysis history
  const fetchHistory = useCallback(async (limit = 50) => {
    try {
      const res = await fetch(`${BASE}/api/models/history?limit=${limit}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('[useModelsHub] Failed to fetch history:', err)
    }
  }, [])

  // Fetch analytics stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/models/stats`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setStats(data.stats || {})
    } catch (err) {
      console.error('[useModelsHub] Failed to fetch stats:', err)
    }
  }, [])

  // Select a model
  const selectModel = useCallback((modelId) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      setSelectedModel(model)
      setError(null)
    }
  }, [models])

  // Handle file upload
  const uploadFile = useCallback((uploadedFile) => {
    if (!uploadedFile) {
      setFile(null)
      return
    }

    if (!selectedModel) {
      setError('Please select a model first')
      return
    }

    // Validate file type
    const fileName = uploadedFile.name.toLowerCase()
    const isImage = fileName.match(/\.(png|jpg|jpeg|webp)$/i)
    const isCsv = fileName.match(/\.csv$/i)

    const supportsImage = selectedModel.supported_inputs.includes('image')
    const supportsCsv = selectedModel.supported_inputs.includes('csv')

    if (isImage && !supportsImage) {
      setError(`${selectedModel.name} does not support image files`)
      return
    }
    if (isCsv && !supportsCsv) {
      setError(`${selectedModel.name} does not support CSV files`)
      return
    }
    if (!isImage && !isCsv) {
      setError('Unsupported file type. Supported: .png, .jpg, .jpeg, .webp, .csv')
      return
    }

    // Check file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (uploadedFile.size > MAX_SIZE) {
      setError(`File too large. Maximum size is 10MB, got ${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB`)
      return
    }

    setFile(uploadedFile)
    setError(null)
  }, [selectedModel])

  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (!selectedModel || !file) {
      setError('Please select a model and upload a file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(
        `${BASE}/api/models/analyze?model_id=${selectedModel.id}`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || `API error ${res.status}`)
      }

      const data = await res.json()
      setResults(data)

      // Refresh history and stats
      await fetchHistory()
      await fetchStats()
    } catch (err) {
      setError(err.message)
      console.error('[useModelsHub] Analysis failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel, file, fetchHistory, fetchStats])

  // Clear results
  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
  }, [])

  // Clear file
  const clearFile = useCallback(() => {
    setFile(null)
    setError(null)
  }, [])

  // Export results as JSON
  const exportResults = useCallback(() => {
    if (!results) return

    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analysis_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [results])

  return {
    // State
    models,
    selectedModel,
    file,
    results,
    isLoading,
    error,
    history,
    stats,

    // Actions
    fetchModels,
    fetchHistory,
    fetchStats,
    selectModel,
    uploadFile,
    runAnalysis,
    clearResults,
    clearFile,
    exportResults,
  }
}
