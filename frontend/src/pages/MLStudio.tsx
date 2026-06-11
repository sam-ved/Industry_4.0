import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import BackgroundGlow from '../components/common/BackgroundGlow';
import DatasetUploader from '../components/MLStudio/DatasetUploader';
import DatasetPreview from '../components/MLStudio/DatasetPreview';
import FeatureSelector from '../components/MLStudio/FeatureSelector';
import AlgorithmSelector from '../components/MLStudio/AlgorithmSelector';
import TrainingPanel from '../components/MLStudio/TrainingPanel';
import ResultsDashboard from '../components/MLStudio/ResultsDashboard';

const steps = ['Upload', 'Features', 'Algorithm', 'Training', 'Results'];

export default function MLStudio() {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [datasetData, setDatasetData] = useState<any>(null);
  const [config, setConfig] = useState<any>({
    targetColumn: '',
    features: [],
    algorithm: '',
    taskType: ''
  });
  const [results, setResults] = useState<any>(null);

  const handleUploadSuccess = (data: any) => {
    setDatasetData(data);
    setCurrentStep(1); // Go to Preview/Features
  };

  const handleReset = () => {
    setCurrentStep(0);
    setDatasetData(null);
    setConfig({ targetColumn: '', features: [], algorithm: '', taskType: '' });
    setResults(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#081120' }}>
      <BackgroundGlow />
      
      <div className="relative z-10 mx-auto max-w-screen-xl px-6 py-8 sm:px-8 lg:px-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-lg border transition-all hover:bg-[rgba(255,255,255,0.05)]"
              style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <ArrowLeft size={20} className="text-[#94A3B8]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Beaker size={20} className="text-[#8B5CF6]" />
                <h1 className="text-2xl font-bold tracking-tight text-[#F9FAFB]">AutoML Studio</h1>
              </div>
              <p className="text-sm text-[#64748B] mt-1">Train custom models directly from your datasets</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  idx === currentStep 
                    ? 'bg-[#8B5CF6] text-white' 
                    : idx < currentStep 
                      ? 'bg-[rgba(139,92,246,0.2)] text-[#8B5CF6]' 
                      : 'bg-[rgba(255,255,255,0.05)] text-[#64748B]'
                }`}>
                  {step}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-4 h-px mx-1 ${idx < currentStep ? 'bg-[#8B5CF6]' : 'bg-[rgba(255,255,255,0.1)]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <div className="max-w-2xl mx-auto mt-12">
                  <DatasetUploader onUploadSuccess={handleUploadSuccess} />
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="flex flex-col gap-8">
                  <DatasetPreview data={datasetData} onNext={() => setCurrentStep(2)} />
                </div>
              )}

              {currentStep === 2 && (
                <FeatureSelector 
                  data={datasetData} 
                  config={config} 
                  setConfig={setConfig} 
                  onNext={() => setCurrentStep(3)} 
                  onBack={() => setCurrentStep(1)} 
                />
              )}

              {currentStep === 3 && (
                <AlgorithmSelector 
                  config={config} 
                  setConfig={setConfig} 
                  onNext={() => setCurrentStep(4)} 
                  onBack={() => setCurrentStep(2)} 
                />
              )}

              {currentStep === 4 && (
                <TrainingPanel 
                  data={datasetData} 
                  config={config} 
                  setResults={setResults} 
                  onNext={() => setCurrentStep(5)} 
                />
              )}

              {currentStep === 5 && (
                <ResultsDashboard 
                  results={results} 
                  config={config} 
                  onReset={handleReset} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
