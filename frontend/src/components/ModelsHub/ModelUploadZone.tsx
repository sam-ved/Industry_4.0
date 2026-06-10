// frontend/src/components/ModelsHub/ModelUploadZone.jsx
// File upload component for models

import { useRef, useState } from 'react'
import { UploadCloud, Image as ImageIcon, FileSpreadsheet, FileText, AlertTriangle, X, RefreshCw, Play } from 'lucide-react'


export default function ModelUploadZone({
  selectedModel,
  file,
  isLoading,
  onFileSelect,
  onFileRemove,
  onAnalyze,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      onFileSelect(droppedFiles[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  const getAcceptedTypes = () => {
    if (!selectedModel) return ''
    const types = []
    if (selectedModel.supported_inputs.includes('image')) {
      types.push('.png', '.jpg', '.jpeg', '.webp')
    }
    if (selectedModel.supported_inputs.includes('csv')) {
      types.push('.csv')
    }
    return types.join(',')
  }

  const getFilePreview = () => {
    if (!file) return null

    const isImage = file.name.match(/\.(png|jpg|jpeg|webp)$/i)
    const isCsv = file.name.match(/\.csv$/i)

    return {
      isImage,
      isCsv,
      size: (file.size / 1024).toFixed(1),
    }
  }

  const preview = getFilePreview()

  return (
    <div className="flex flex-col gap-5">
      {/* Model Info */}
      {selectedModel ? (
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-9xl leading-none">
            {selectedModel.icon}
          </div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                Selected Model
              </h3>
              <p className="text-xl font-bold text-white mb-1">{selectedModel.name}</p>
              <p className="text-sm text-slate-400 mb-4">{selectedModel.description}</p>

              {/* Supported Input Types */}
              <div className="flex gap-2">
                {selectedModel.supported_inputs.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 bg-slate-900/50 text-slate-300"
                  >
                    {type === 'image' ? <ImageIcon size={14} className="text-blue-400" /> : <FileSpreadsheet size={14} className="text-emerald-400" />}
                    {type === 'image' ? 'Image' : 'CSV'}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              {selectedModel.icon}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-800/20 border border-dashed border-slate-700/60 text-center flex flex-col items-center justify-center min-h-[140px]">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
            <Play className="text-slate-500" size={20} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Select a model from the left panel to begin</p>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-cyan-500/50 bg-cyan-500/10 scale-[1.02]'
            : 'border-slate-700/60 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-600/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept={getAcceptedTypes()}
          disabled={!selectedModel || isLoading}
          className="hidden"
        />

        {file ? (
          // File Selected State
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg">
              {preview?.isImage ? (
                <ImageIcon size={32} className="text-blue-400" />
              ) : preview?.isCsv ? (
                <FileSpreadsheet size={32} className="text-emerald-400" />
              ) : (
                <FileText size={32} className="text-slate-400" />
              )}
            </div>
            <p className="text-base font-semibold text-white mb-1 truncate max-w-xs mx-auto">{file.name}</p>
            <p className="text-sm text-slate-400 mb-5">{preview?.size} KB</p>

            {preview?.isImage && (
              <div className="mt-2 mb-6 max-h-40 rounded-lg overflow-hidden border border-slate-700/50 shadow-md inline-block">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="max-w-full max-h-40 object-cover"
                />
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onFileRemove(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
              >
                <X size={16} />
                Remove
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-600"
              >
                <RefreshCw size={16} />
                Change
              </button>
            </div>
          </div>
        ) : (
          // No File State
          <div
            className="text-center cursor-pointer py-6"
            onClick={() => selectedModel && fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} className={selectedModel ? "text-cyan-400" : "text-slate-500"} />
            </div>
            <p className="text-white font-semibold mb-1 text-lg">
              Drag & drop or click to upload
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Maximum file size: 10MB
            </p>
            {selectedModel && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Supported:</span> {selectedModel.supported_inputs.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Button */}
      <button
        onClick={onAnalyze}
        disabled={!selectedModel || !file || isLoading}
        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base shadow-lg ${
          selectedModel && file && !isLoading
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] hover:shadow-cyan-500/25'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 shadow-none'
        }`}
      >
        {isLoading ? (
          <>
            <RefreshCw className="animate-spin" size={20} />
            Analyzing Data...
          </>
        ) : (
          <>
            <Play size={20} className={selectedModel && file ? "text-cyan-100" : "text-slate-600"} />
            Run Analysis
          </>
        )}
      </button>

      {/* File Size Warning */}
      {file && file.size > 5 * 1024 * 1024 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <p>Large file detected ({(file.size / 1024 / 1024).toFixed(1)}MB). Analysis may take slightly longer to process.</p>
        </div>
      )}
    </div>
  )
}
