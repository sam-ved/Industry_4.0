import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, FileSpreadsheet, HardDrive, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mlStudioAPI } from '../../services/api';

interface DatasetUploaderProps {
  onUploadSuccess: (data: any) => void;
}

export default function DatasetUploader({ onUploadSuccess }: DatasetUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      return 'Unsupported file format. Please upload CSV, XLSX, or JSON.';
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'File exceeds 50 MB limit.';
    }
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setUploadedFile({ name: file.name, size: file.size });

    try {
      const result = await mlStudioAPI.upload(file);
      onUploadSuccess(result.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Upload failed';
      setError(message);
      setUploadedFile(null);
    } finally {
      setLoading(false);
    }
  }, [onUploadSuccess]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div className="w-full">
      <h2 className="mb-1 text-xl font-bold text-[#F9FAFB]">Upload Dataset</h2>
      <p className="mb-6 text-sm text-[#64748B]">
        Drag and drop or browse. Supports <span className="text-[#94A3B8]">CSV</span>, <span className="text-[#94A3B8]">XLSX</span>, and <span className="text-[#94A3B8]">JSON</span> up to 50 MB.
      </p>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition-all duration-300 sm:p-14 ${
          dragActive
            ? 'border-[#06B6D4] bg-[rgba(6,182,212,0.06)]'
            : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(6,182,212,0.4)] hover:bg-[rgba(6,182,212,0.02)]'
        }`}
        style={{ background: dragActive ? 'rgba(6,182,212,0.06)' : 'rgba(11,20,35,0.6)' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="mb-5 p-4 rounded-2xl"
                style={{ background: 'rgba(6,182,212,0.1)' }}
              >
                <Upload size={28} style={{ color: '#06B6D4' }} />
              </motion.div>
              <p className="text-[#06B6D4] font-semibold text-sm">Processing dataset...</p>
              {uploadedFile && (
                <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <FileSpreadsheet size={14} className="text-[#94A3B8]" />
                  <span className="text-xs text-[#94A3B8]">{uploadedFile.name}</span>
                  <span className="text-xs text-[#64748B]">({formatSize(uploadedFile.size)})</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <div className="p-4 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {uploadedFile ? (
                  <CheckCircle2 size={28} className="text-[#10B981]" />
                ) : (
                  <FileText size={28} className="text-[#94A3B8]" />
                )}
              </div>
              <p className="mb-1 font-semibold text-[#F9FAFB]">
                {uploadedFile ? 'Dataset uploaded' : 'Drag and drop your file here'}
              </p>
              {uploadedFile ? (
                <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.16)' }}>
                  <FileSpreadsheet size={14} className="shrink-0 text-[#10B981]" />
                  <span className="max-w-[240px] truncate text-xs text-[#CBD5E1]">{uploadedFile.name}</span>
                  <span className="text-xs text-[#64748B]">({formatSize(uploadedFile.size)})</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#64748B]">or click to browse from your computer</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {['CSV', 'XLSX', 'JSON'].map(fmt => (
                      <div key={fmt} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider"
                        style={{ background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <HardDrive size={10} />
                        {fmt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-3 rounded-lg p-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} className="text-[#EF4444] flex-shrink-0" />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
