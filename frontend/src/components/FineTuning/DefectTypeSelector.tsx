import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface DefectType {
  id: string;
  name: string;
  class_id: number;
  confidence_threshold: number;
  color: string;
}

export function DefectTypeSelector({ datasetId }: { datasetId: string }) {
  const [defectTypes, setDefectTypes] = useState<DefectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchParameters = useCallback(async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/parameters/${datasetId}/all`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) setDefectTypes(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [datasetId]);

  // Fetch existing on mount if datasetId is present
  useEffect(() => {
    if (datasetId) {
      fetchParameters();
    }
  }, [datasetId, fetchParameters]);

  const handleAdd = () => {
    const newId = `dt_${Math.random().toString(36).substr(2, 9)}`;
    setDefectTypes([
      ...defectTypes,
      { id: newId, name: '', class_id: defectTypes.length, confidence_threshold: 0.5, color: '#FF0000' }
    ]);
  };

  const handleRemove = (id: string) => {
    setDefectTypes(defectTypes.filter(d => d.id !== id).map((d, idx) => ({ ...d, class_id: idx })));
  };

  const handleChange = (id: string, field: keyof DefectType, value: any) => {
    setDefectTypes(defectTypes.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    if (!datasetId) {
      setMessage("Please upload a dataset first.");
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/parameters/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, defect_types: defectTypes })
      });
      
      if (!response.ok) throw new Error("Failed to save");
      
      setMessage("Configuration saved successfully!");
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
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
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Defect Types (Classes)</h2>
      
      <div className="space-y-4 mb-6">
        {defectTypes.map((dt) => (
          <div key={dt.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold">
              {dt.class_id}
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Class Name</label>
                <input 
                  type="text" 
                  value={dt.name}
                  onChange={(e) => handleChange(dt.id, 'name', e.target.value)}
                  className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="e.g. scratch"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Conf. Threshold: {dt.confidence_threshold}</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={dt.confidence_threshold}
                  onChange={(e) => handleChange(dt.id, 'confidence_threshold', parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <input 
                  type="color" 
                  value={dt.color}
                  onChange={(e) => handleChange(dt.id, 'color', e.target.value)}
                  className="w-full h-9 rounded cursor-pointer"
                />
              </div>
            </div>
            
            <button 
              onClick={() => handleRemove(dt.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4">
        <button 
          onClick={handleAdd}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-gray-700"
        >
          + Add Defect Type
        </button>
        
        <button 
          onClick={handleSave}
          disabled={loading || defectTypes.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-md mt-4 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </motion.div>
  );
}
