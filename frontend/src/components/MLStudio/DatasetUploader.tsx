import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DatasetUploader({ onUploadSuccess }: { onUploadSuccess: (data: any) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/ml-studio/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Upload failed');
      
      onUploadSuccess(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-[#F9FAFB]">Upload Dataset</h2>
      <p className="text-sm text-[#94A3B8] mb-6">Supported formats: CSV, XLSX, JSON</p>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-[#06B6D4] bg-[rgba(6,182,212,0.05)]'
            : 'border-[rgba(255,255,255,0.1)] hover:border-[#06B6D4] hover:bg-[rgba(6,182,212,0.02)]'
        }`}
        style={{ background: dragActive ? 'rgba(6,182,212,0.05)' : 'rgba(11,20,35,0.6)' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleChange}
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-4"
            >
              <Upload size={32} style={{ color: '#06B6D4' }} />
            </motion.div>
            <p className="text-[#06B6D4] font-medium">Processing dataset...</p>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <FileText size={32} style={{ color: '#94A3B8' }} />
            </div>
            <p className="text-[#F9FAFB] font-medium mb-1">Drag and drop your file here</p>
            <p className="text-sm text-[#64748B]">or click to browse from your computer</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={18} className="text-[#EF4444]" />
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}
    </div>
  );
}
