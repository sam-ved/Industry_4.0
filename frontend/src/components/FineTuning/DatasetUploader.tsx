import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export function DatasetUploader({ onUploadSuccess }: { onUploadSuccess?: (datasetId: string) => void }) {
  const [datasetName, setDatasetName] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [annotations, setAnnotations] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const annotationInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleAnnotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnnotations(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!datasetName || images.length === 0 || annotations.length === 0) {
      setMessage("Please provide a name, images, and annotations.");
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('dataset_name', datasetName);
    images.forEach((file) => formData.append('files', file));
    annotations.forEach((file) => formData.append('annotations', file));

    try {
      // Use the injected NEXT_PUBLIC_API_URL or similar if available, otherwise relative
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/datasets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setMessage(`Upload successful! Dataset ID: ${data.dataset_id}`);
      if (onUploadSuccess) onUploadSuccess(data.dataset_id);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Upload Dataset</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dataset Name</label>
          <input 
            type="text" 
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white"
            placeholder="e.g. Defect_Dataset_v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Images</label>
          <input 
            type="file" 
            multiple 
            accept="image/jpeg, image/png"
            ref={imageInputRef}
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">{images.length} files selected</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YOLO Annotations (.txt)</label>
          <input 
            type="file" 
            multiple 
            accept=".txt"
            ref={annotationInputRef}
            onChange={handleAnnotationChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">{annotations.length} files selected</p>
        </div>

        <button 
          onClick={handleUpload} 
          disabled={uploading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Dataset'}
        </button>

        {message && (
          <div className={`p-3 rounded-md mt-4 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </motion.div>
  );
}
