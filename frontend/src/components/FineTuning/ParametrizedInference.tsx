import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function ParametrizedInference() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Hardcoded for demo, normally fetched based on dataset linked to model
  const [parameters, setParameters] = useState<any>({
    "0": { enabled: true, confidence_threshold: 0.5, color: "#FF0000", name: "scratch" },
    "1": { enabled: true, confidence_threshold: 0.5, color: "#00FF00", name: "dent" }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchModels = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/models/registry?status=deployed`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
        if (data.length > 0) {
          setSelectedModel(data[0].model_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setDetections([]);
    }
  };

  const handleRunInference = async () => {
    if (!selectedModel || !image) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('model_id', selectedModel);
    formData.append('image_file', image);
    formData.append('detection_parameters', JSON.stringify(parameters));
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/inference/predict`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setDetections(data.detections || []);
        drawDetections(data.detections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const drawDetections = (dets: any[]) => {
    if (!canvasRef.current || !imagePreview) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      dets.forEach(d => {
        const [x1, y1, x2, y2] = d.bbox;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        
        ctx.fillStyle = d.color;
        ctx.font = '16px Arial';
        ctx.fillText(`${d.class_name} ${(d.confidence * 100).toFixed(1)}%`, x1, y1 - 5);
      });
    };
    img.src = imagePreview;
  };

  const toggleParam = (id: string, field: string, value: any) => {
    setParameters({
      ...parameters,
      [id]: { ...parameters[id], [field]: value }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Parametrized Inference</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Deployed Model</label>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {models.map(m => (
                <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
              ))}
              {models.length === 0 && <option value="">No deployed models</option>}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-200">Detection Parameters</h3>
            {Object.keys(parameters).map(key => (
              <div key={key} className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={parameters[key].enabled}
                      onChange={(e) => toggleParam(key, 'enabled', e.target.checked)}
                      className="rounded"
                    />
                    {parameters[key].name}
                  </label>
                  <input 
                    type="color" 
                    value={parameters[key].color}
                    onChange={(e) => toggleParam(key, 'color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Conf: {parameters[key].confidence_threshold}</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05"
                    value={parameters[key].confidence_threshold}
                    onChange={(e) => toggleParam(key, 'confidence_threshold', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleRunInference}
            disabled={!selectedModel || !image || loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Inference'}
          </button>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[400px] flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
            {imagePreview ? (
              <canvas ref={canvasRef} className="max-w-full max-h-[600px] object-contain" />
            ) : (
              <span className="text-gray-400">Upload an image to see results</span>
            )}
          </div>
          
          {detections.length > 0 && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-800 dark:text-white">Detections ({detections.length})</h3>
              <div className="flex flex-wrap gap-2">
                {detections.map((d, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: d.color }}>
                    {d.class_name}: {(d.confidence * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
