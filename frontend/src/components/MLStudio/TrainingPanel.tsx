import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle } from 'lucide-react';

export default function TrainingPanel({ data, config, setResults, onNext }: any) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    
    const runTraining = async () => {
      try {
        // Fake progress updates for UI feel
        let p = 0;
        interval = setInterval(() => {
          p += Math.random() * 15;
          if (p > 90) p = 90;
          setProgress(p);
          if (p > 20 && p < 50) setStatus('Preprocessing data & encoding categorical variables...');
          if (p >= 50 && p < 80) setStatus(`Training ${config.algorithm}...`);
          if (p >= 80) setStatus('Evaluating model performance...');
        }, 500);

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/ml-studio/train`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: data.file_id,
            target_column: config.targetColumn,
            features: config.features,
            algorithm: config.algorithm,
            task_type: config.taskType
          })
        });

        const res = await response.json();
        clearInterval(interval);
        
        if (!response.ok) throw new Error(res.detail || 'Training failed');
        
        setProgress(100);
        setStatus('Training complete!');
        setResults(res.data);
        
        setTimeout(() => {
          onNext();
        }, 1000);

      } catch (err: any) {
        clearInterval(interval);
        setError(err.message);
        setStatus('Training failed');
      }
    };

    runTraining();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-full max-w-md p-8 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden" 
           style={{ background: 'rgba(11,20,35,0.8)', borderColor: 'rgba(6,182,212,0.2)' }}>
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#06B6D4] opacity-20 blur-[50px] rounded-full pointer-events-none" />

        {error ? (
           <div className="text-[#EF4444] mb-4">
             <div className="mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-[rgba(239,68,68,0.1)]">
               <span className="text-2xl font-bold">X</span>
             </div>
             <p className="font-semibold text-lg">{status}</p>
             <p className="text-sm mt-2 opacity-80">{error}</p>
           </div>
        ) : (
          <>
            <motion.div 
              animate={{ rotate: progress === 100 ? 0 : 360 }}
              transition={{ repeat: progress === 100 ? 0 : Infinity, duration: 2, ease: "linear" }}
              className="mb-6 p-4 rounded-full border border-[rgba(6,182,212,0.3)] bg-[rgba(6,182,212,0.05)]"
            >
              {progress === 100 ? (
                <CheckCircle size={32} className="text-[#10B981]" />
              ) : (
                <Cpu size={32} className="text-[#06B6D4]" />
              )}
            </motion.div>

            <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">{status}</h3>
            
            <div className="w-full bg-[rgba(255,255,255,0.1)] h-2 rounded-full overflow-hidden mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]"
              />
            </div>
            
            <p className="text-xs text-[#94A3B8] mt-3 font-mono">{Math.round(progress)}%</p>
          </>
        )}
      </div>
    </div>
  );
}
