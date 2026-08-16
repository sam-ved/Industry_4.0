import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ModelRegistryItem {
  model_id: string;
  model_name: string;
  val_accuracy: number | null;
  generalization_gap: number | null;
  status: string;
}

export function ModelRegistry() {
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/models/registry`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleAction = async (model_id: string, action: 'deploy' | 'rollback' | 'archive') => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const method = action === 'archive' ? 'DELETE' : 'POST';
      const url = action === 'archive' ? `${API_URL}/api/models/${model_id}` : `${API_URL}/api/models/${model_id}/${action}`;
      
      const res = await fetch(url, { method });
      if (res.ok) {
        fetchModels();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading registry...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Model Registry</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Model Name</th>
              <th className="px-4 py-3">Val Accuracy</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.model_id} className="border-b dark:border-gray-700">
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  {model.model_name}
                  <div className="text-xs text-gray-400">{model.model_id}</div>
                </td>
                <td className="px-4 py-4">
                  {model.val_accuracy !== null ? (model.val_accuracy * 100).toFixed(1) + '%' : 'N/A'}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium 
                    ${model.status === 'deployed' ? 'bg-green-100 text-green-800' : 
                      model.status === 'archived' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                    {model.status}
                  </span>
                </td>
                <td className="px-4 py-4 flex gap-2">
                  {model.status !== 'deployed' && model.status !== 'archived' && (
                    <button 
                      onClick={() => handleAction(model.model_id, 'deploy')}
                      className="text-blue-600 hover:underline"
                    >
                      Deploy
                    </button>
                  )}
                  {model.status === 'superseded' && (
                    <button 
                      onClick={() => handleAction(model.model_id, 'rollback')}
                      className="text-yellow-600 hover:underline"
                    >
                      Rollback
                    </button>
                  )}
                  {model.status !== 'archived' && (
                    <button 
                      onClick={() => handleAction(model.model_id, 'archive')}
                      className="text-red-600 hover:underline"
                    >
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center">No models in registry.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
