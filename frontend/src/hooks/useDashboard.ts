// src/hooks/useDashboard.js
// Drop this in src/hooks/ — import it in Dashboard.jsx

import { useState, useEffect, useCallback } from 'react'
import {
  dashboardAPI, llmAPI,
} from '../services/api'

export function useDashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [insights,    setInsights]    = useState<any>(null)
  const [llmHealth,   setLlmHealth]   = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<any>(null)

  const fetchAll = useCallback(async () => {
    try {
      const res = await dashboardAPI.summary()
      if (res && res.data) {
        setKpis(res.data.kpis)
      }
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInsights = useCallback(async () => {
    try {
      const res = await llmAPI.dashboard()
      setInsights(res)
    } catch (err: any) {
      console.warn('[Insights] LLM call failed:', err.message)
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const res = await llmAPI.health()
      setLlmHealth(res)
    } catch (err: any) {
      console.warn('[Insights] LLM Health fetch failed:', err.message)
      setLlmHealth({ status: 'degraded', connected: false })
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchInsights()
    fetchHealth()

    // Re-run fetchers directly on interval
    const moduleTimer  = setInterval(fetchAll,     8000)
    const insightTimer = setInterval(fetchInsights, 30000)
    const healthTimer  = setInterval(fetchHealth,  30000)

    return () => {
      clearInterval(moduleTimer)
      clearInterval(insightTimer)
      clearInterval(healthTimer)
    }
  }, [fetchAll, fetchInsights, fetchHealth])

  return {
    kpis, insights, llmHealth, loading, error,
    refresh: fetchAll,
  }
}