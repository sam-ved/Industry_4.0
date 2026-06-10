// src/components/ModelInputHandler.tsx
// Dynamic file upload component with validation per model type
import { useState } from 'react'
import { Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ModelInputHandlerProps {
  modelType: 'yolo' | 'ppe' | 'energy' | 'predictive'
  onFileSelect: (file: File) => void
  disabled?: boolean
}

// Define allowed file types for each model
const MODEL_CONFIG: Record<string, { accepts: string[]; maxSizeMB: number; description: string }> = {
  yolo: {
    accepts: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 10,
    description: 'JPG, PNG, or WebP images (up to 10MB)',
  },
  ppe: {
    accepts: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    maxSizeMB: 50,
    description: 'JPG, PNG, WebP images or MP4/MOV videos (up to 50MB)',
  },
  energy: {
    accepts: ['text/csv', 'application/vnd.ms-excel'],
    maxSizeMB: 20,
    description: 'CSV files with sensor data (up to 20MB)',
  },
  predictive: {
    accepts: ['text/csv', 'application/vnd.ms-excel'],
    maxSizeMB: 20,
    description: 'CSV files with historical maintenance records (up to 20MB)',
  },
}

export default function ModelInputHandler({
  modelType,
  onFileSelect,
  disabled = false,
}: ModelInputHandlerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const config = MODEL_CONFIG[modelType]

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!config.accepts.some((type) => file.type.match(type.replace('/*', '.*')))) {
      setError(`Invalid file type. Allowed: ${config.description}`)
      return false
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > config.maxSizeMB) {
      setError(`File too large. Maximum: ${config.maxSizeMB}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = (file: File) => {
    setError(null)

    if (validateFile(file)) {
      setSelectedFileName(file.name)
      onFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <motion.div
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          accept={config.accepts.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="flex flex-col items-center justify-center">
          <FileUp
            size={32}
            className={`mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`}
          />
          <p className="text-sm font-medium text-slate-200">
            Drag and drop your file here
          </p>
          <p className="text-xs text-slate-500 mt-1">or click to browse</p>
        </label>
      </motion.div>

      {/* File Type Info */}
      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg flex items-start gap-2">
        <Upload size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">{config.description}</p>
      </div>

      {/* Selected File */}
      {selectedFileName && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-100 truncate">{selectedFileName}</p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2"
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
