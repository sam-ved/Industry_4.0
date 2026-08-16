import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function TrainingProgressMonitor({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    
    // eslint-disable-next-line prefer-const
    let interval: ReturnType<typeof setInterval>;
    
    const fetchStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/finetune/${jobId}/status`);
        if (!res.ok) throw new Error("Failed to fetch status");
        
        const data = await res.json();
        setStatus(data);
        
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(interval);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
    interval = setInterval(fetchStatus, 2000);
    
    return () => clearInterval(interval);
  }, [jobId]);

  const handleCancel = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/finetune/${jobId}/cancel`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!status) return <div>No job data.</div>;

  const progress = status.progress || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Training Monitor</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
          ${status.status === 'training' ? 'bg-blue-100 text-blue-800' : 
            status.status === 'completed' ? 'bg-green-100 text-green-800' :
            status.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
        >
          {status.status}
        </span>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-400">
          <span>Progress ({progress}%)</span>
          <span>Epoch: {status.epoch || 0}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current Loss</p>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {status.current_loss !== null ? status.current_loss.toFixed(4) : '-'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Validation Loss</p>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {status.val_loss !== null ? status.val_loss.toFixed(4) : '-'}
          </p>
        </div>
      </div>
      
      {status.status === 'training' && (
        <button 
          onClick={handleCancel}
          className="w-full py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
        >
          Cancel Training
        </button>
      )}

      {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
    </motion.div>
  );
}
