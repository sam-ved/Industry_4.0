// src/components/BackendStatusIndicator.tsx
// Shows backend connectivity status in header
import { useBackendStatus } from '../hooks/useBackendStatus'
import { Wifi, WifiOff, Loader } from 'lucide-react'

interface BackendStatusIndicatorProps {
  compact?: boolean
}

export default function BackendStatusIndicator({ compact = false }: BackendStatusIndicatorProps) {
  const status = useBackendStatus()

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
        <div
          className={`w-2 h-2 rounded-full ${
            status.isOnline ? 'bg-emerald-500' : 'bg-red-500'
          } ${status.isLoading ? 'animate-pulse' : ''}`}
        />
        <span className="text-sm">
          {status.isLoading ? 'Checking...' : status.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
        status.isOnline
          ? 'bg-emerald-500/10 border-emerald-500/50'
          : 'bg-red-500/10 border-red-500/50'
      }`}
    >
      {status.isLoading ? (
        <Loader size={18} className="animate-spin text-slate-400" />
      ) : status.isOnline ? (
        <Wifi size={18} className="text-emerald-400" />
      ) : (
        <WifiOff size={18} className="text-red-400" />
      )}
      <div>
        <p className="text-sm font-medium">
          {status.isOnline ? 'Backend Online' : 'Backend Offline'}
        </p>
        {status.lastChecked && (
          <p className="text-xs text-slate-500">
            Last checked: {status.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
