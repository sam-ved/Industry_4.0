// src/hooks/useBackendStatus.ts
// Monitor backend health and connectivity
import { useEffect, useState, useCallback } from 'react'
import { healthAPI, pollInterval } from '../services/api'

export interface BackendStatus {
  isOnline: boolean
  isLoading: boolean
  error: string | null
  lastChecked: Date | null
}

export function useBackendStatus(checkInterval = 3000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: false,
    isLoading: true,
    error: null,
    lastChecked: null,
  })

  const handleHealthCheck = useCallback(async () => {
    try {
      const result = await healthAPI.check()
      setStatus({
        isOnline: result.status === 'ok',
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      })
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      }))
    }
  }, [])

  useEffect(() => {
    // Initial check
    handleHealthCheck()

    // Set up polling
    const stopPolling = pollInterval(
      () => healthAPI.check().then((result) => {
        setStatus({
          isOnline: result.status === 'ok',
          isLoading: false,
          error: null,
          lastChecked: new Date(),
        })
      }),
      () => {},
      checkInterval
    )

    return () => stopPolling()
  }, [checkInterval, handleHealthCheck])

  return status
}
