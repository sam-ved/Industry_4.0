// src/services/api.ts
// Centralized API service layer using Axios
import apiClient from '../config/api'

// ──────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: async () => {
    try {
      const response = await apiClient.get('/health')
      // Ensure we pass back the full data object or check status online
      return { status: 'ok', data: response.data }
    } catch (error) {
      return { status: 'error', data: null }
    }
  },
}

// ──────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary: async () => {
    const response = await apiClient.get('/dashboard/summary')
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// DEFECT DETECTION (YOLO)
// ──────────────────────────────────────────────────────────────────────────
export const defectAPI = {
  status: async () => {
    const response = await apiClient.get('/api/defect/status')
    return response.data
  },
  
  analyze: async (imageFile?: File) => {
    const formData = new FormData()
    if (imageFile) {
      formData.append('file', imageFile)
    }
    const response = await apiClient.post('/api/defect/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// PPE MONITORING
// ──────────────────────────────────────────────────────────────────────────
export const ppeAPI = {
  status: async () => {
    const response = await apiClient.get('/api/ppe/status')
    return response.data
  },
  
  analyze: async (file?: File) => {
    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    }
    const response = await apiClient.post('/api/ppe/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// ENERGY ANALYTICS (Random Forest / XGBoost)
// ──────────────────────────────────────────────────────────────────────────
export const energyAPI = {
  status: async () => {
    const response = await apiClient.get('/api/energy/status')
    return response.data
  },
  
  analyze: async (csvFile?: File, payload?: Record<string, unknown>) => {
    if (csvFile) {
      const formData = new FormData()
      formData.append('file', csvFile)
      const response = await apiClient.post('/api/energy/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    
    const response = await apiClient.post('/api/energy/analyze', payload || {})
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// PREDICTIVE MAINTENANCE
// ──────────────────────────────────────────────────────────────────────────
export const maintenanceAPI = {
  status: async () => {
    const response = await apiClient.get('/api/maintenance/status')
    return response.data
  },
  
  analyze: async (csvFile?: File, payload?: Record<string, unknown>) => {
    if (csvFile) {
      const formData = new FormData()
      formData.append('file', csvFile)
      const response = await apiClient.post('/api/maintenance/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    
    const response = await apiClient.post('/api/maintenance/analyze', payload || {})
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// LLM INSIGHTS
// ──────────────────────────────────────────────────────────────────────────
export const llmAPI = {
  health: async () => {
    const response = await apiClient.get('/api/llm/health')
    return response.data
  },

  explain: async (module: string, predictionData: Record<string, unknown>) => {
    const response = await apiClient.post('/api/llm/explain', {
      module: module,
      prediction: predictionData,
    })
    return response.data
  },
  
  chat: async (contextData: Record<string, unknown>, messages: { role: string, content: string }[]) => {
    const response = await apiClient.post('/api/llm/chat', {
      context_data: contextData,
      messages: messages,
    })
    return response.data
  },

  dashboard: async () => {
    const response = await apiClient.get('/api/llm/dashboard')
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// MODELS HUB
// ──────────────────────────────────────────────────────────────────────────
export const modelsAPI = {
  list: async () => {
    const response = await apiClient.get('/api/models/list')
    return response.data
  },
  
  info: async (modelId: string) => {
    const response = await apiClient.get(`/api/models/info/${modelId}`)
    return response.data
  },
  
  analyze: async (modelId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(
      `/api/models/analyze?model_id=${modelId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },
  
  history: async (limit = 50) => {
    const response = await apiClient.get(`/api/models/history?limit=${limit}`)
    return response.data
  },
  
  stats: async () => {
    const response = await apiClient.get('/api/models/stats')
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// ML STUDIO
// ──────────────────────────────────────────────────────────────────────────

export interface MLRunConfig {
  file_id: string
  target_column?: string
  features: string[]
  algorithm: string
  task_type: string
}

export const mlStudioAPI = {
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/ml-studio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },

  suggestFeatures: async (fileId: string, targetColumn: string) => {
    const response = await apiClient.post('/ml-studio/feature-suggestions', {
      file_id: fileId,
      target_column: targetColumn,
    })
    return response.data
  },

  run: async (config: MLRunConfig) => {
    const response = await apiClient.post('/ml-studio/run', config, {
      timeout: 300000,
    })
    return response.data
  },

  insights: async (results: Record<string, unknown>) => {
    const response = await apiClient.post('/ml-studio/insights', { results })
    return response.data
  },
}

// ──────────────────────────────────────────────────────────────────────────
// POLLING HELPER
// ──────────────────────────────────────────────────────────────────────────
export function pollInterval(
  fetcher: () => Promise<unknown>,
  setter: (data: unknown) => void,
  intervalMs = 5000
): () => void {
  let active = true

  const run = async () => {
    if (!active) return
    try {
      const data = await fetcher()
      setter(data)
    } catch (e) {
      console.warn('[API Poll]', e instanceof Error ? e.message : 'Unknown error')
    }
    if (active) {
      setTimeout(run, intervalMs)
    }
  }

  run()
  return () => {
    active = false
  }
}
