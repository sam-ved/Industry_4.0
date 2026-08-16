import { useState } from 'react';
import { DatasetUploader } from '../components/FineTuning/DatasetUploader';
import { DefectTypeSelector } from '../components/FineTuning/DefectTypeSelector';
import { TrainingProgressMonitor } from '../components/FineTuning/TrainingProgressMonitor';
import { ModelRegistry } from '../components/FineTuning/ModelRegistry';
import { ParametrizedInference } from '../components/FineTuning/ParametrizedInference';
import { AutoMLDashboard } from '../components/AutoML/AutoMLDashboard';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function FineTuning() {
  useDocumentMeta('Fine-Tuning Studio', 'Train custom defect detection models and perform AutoML on sensor data with the self-training pipeline.');
  const [activeTab, setActiveTab] = useState('dataset');
  const [datasetId, setDatasetId] = useState('');
  const [jobId, setJobId] = useState('');

  const tabs = [
    { id: 'dataset', label: '1. Dataset' },
    { id: 'params', label: '2. Parameters' },
    { id: 'train', label: '3. Train' },
    { id: 'registry', label: '4. Registry' },
    { id: 'inference', label: '5. Inference' },
    { id: 'automl', label: 'AutoML (CSV)' }
  ];

  const handleStartTraining = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/finetune/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          model_backbone: 'yolov8n',
          epochs: 50,
          batch_size: 16,
          learning_rate: 0.001
        })
      });
      if (res.ok) {
        const data = await res.json();
        setJobId(data.job_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ML Studio (Self-Training)</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Train custom defect detection models and perform AutoML on sensor data.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'dataset' && (
          <DatasetUploader onUploadSuccess={(id) => {
            setDatasetId(id);
            setActiveTab('params');
          }} />
        )}
        
        {activeTab === 'params' && (
          <div className="space-y-6">
            <DefectTypeSelector datasetId={datasetId} />
            {datasetId && (
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    handleStartTraining();
                    setActiveTab('train');
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
                >
                  Start Training Model
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'train' && (
          <div>
            {jobId ? (
              <TrainingProgressMonitor jobId={jobId} />
            ) : (
              <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg">
                No training job active. Please upload a dataset and start training from the Parameters tab.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'registry' && (
          <ModelRegistry />
        )}
        
        {activeTab === 'inference' && (
          <ParametrizedInference />
        )}

        {activeTab === 'automl' && (
          <AutoMLDashboard />
        )}
      </div>
    </div>
  );
}
