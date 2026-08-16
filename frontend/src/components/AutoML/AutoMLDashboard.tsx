import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PCAVisualization } from './PCAVisualization';

export function AutoMLDashboard() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [modelType, setModelType] = useState('xgboost');
  const [pcaThreshold, setPcaThreshold] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      // In a real app we might parse the CSV headers here to populate targetColumn dropdown
    }
  };

  const handleTrain = async () => {
    if (!csvFile || !targetColumn) {
      setError("Please provide a CSV file and specify the target column.");
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    formData.append('target_column', targetColumn);
    formData.append('model_type', modelType);
    formData.append('pca_variance_threshold', pcaThreshold.toString());

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/automl/train`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Training failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">AutoML & PCA Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dataset (CSV)</label>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Column Name</label>
            <input 
              type="text" 
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              placeholder="e.g., target"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Type</label>
            <select 
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="xgboost">XGBoost (Recommended)</option>
              <option value="random_forest">Random Forest</option>
              <option value="linear_regression">Linear Regression</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PCA Variance Threshold: {pcaThreshold}
            </label>
            <input 
              type="range" 
              min="0.5" max="0.99" step="0.01"
              value={pcaThreshold}
              onChange={(e) => setPcaThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <button 
            onClick={handleTrain}
            disabled={loading || !csvFile || !targetColumn}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Training...' : 'Start Training'}
          </button>
          
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
        
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 uppercase">R² Score</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{result.metrics.r2_score.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 uppercase">RMSE</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{result.metrics.rmse.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 uppercase">PCA Compression</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {result.pca_stats.original_features} → {result.pca_stats.reduced_features} features
                  </p>
                </div>
              </div>
              
              <PCAVisualization pcaStats={result.pca_stats} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[300px]">
              <p className="text-gray-400">Configure parameters and start training to see results</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
