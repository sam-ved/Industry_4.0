// src/hooks/useDashboard.js
// Drop this in src/hooks/ — import it in Dashboard.jsx

import { useState, useEffect, useCallback } from 'react'
import {
  dashboardAPI, llmAPI,
} from '../services/api'

export function useDashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [insights,    setInsights]    = useState<any>(null)
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
      setInsights(res.llm_insights)
    } catch (err: any) {
      console.warn('[Insights] LLM call failed:', err.message)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchInsights()

    // Re-run fetchers directly on interval
    const moduleTimer  = setInterval(fetchAll,     8000)
    const insightTimer = setInterval(fetchInsights, 30000)

    return () => {
      clearInterval(moduleTimer)
      clearInterval(insightTimer)
    }
  }, [fetchAll, fetchInsights])

  return {
    kpis, insights, loading, error,
    refresh: fetchAll,
  }
}