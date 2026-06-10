import { useState } from 'react'
import { motion } from 'framer-motion'
import { CloudUpload } from 'lucide-react'

const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export default function UploadDropzone({ onFilesChange }: any) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (fileList: any) => {
    if (!fileList) return
    const filesArray = Array.from(fileList).filter((file: any) => acceptedTypes.includes(file.type))
    if (filesArray.length > 0) {
      onFilesChange(filesArray)
    }
  }

  const handleDrop = (event: any) => {
    event.preventDefault()
    setDragActive(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="grid gap-6">
      <motion.label
        htmlFor="upload-input"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-6 py-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-[#06B6D4] bg-[#06B6D4]/8 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
            : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)]'
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <motion.div
          animate={{ scale: dragActive ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <CloudUpload className="mx-auto h-14 w-14 text-[#06B6D4]" />
        </motion.div>
        <p className="mt-4 text-lg font-semibold text-[#F9FAFB]">Drag & drop part images</p>
        <p className="mt-2 max-w-xs text-sm text-[#CBD5E1]">PNG, JPG, WEBP up to 10MB each</p>
        <span className="mt-5 inline-flex rounded-lg bg-[#06B6D4]/20 px-4 py-2.5 text-sm font-semibold text-[#06B6D4] border border-[#06B6D4]/40 transition-all duration-200 group-hover:bg-[#06B6D4]/30 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          Browse files
        </span>
        <input
          id="upload-input"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files)
          }}
        />
      </motion.label>
    </div>
  )
}
