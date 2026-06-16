import React, { useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const PIPELINE_STAGES = [
  "PDF Splitter",
  "OCR Engine",
  "Text Preprocessing",
  "Ray Parallel ADK Agents",
  "Voting Engine",
  "Confidence Engine",
  "Reason Aggregator",
  "Confidence Threshold Checker",
  "Finalizing Output"
];

function Upload({ user, navigate }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateFile(selectedFile);
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Invalid file format. Only PDF files are allowed.');
      setFile(null);
      return;
    }
    
    setError('');
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }
    
    setUploading(true);
    setCurrentStageIndex(0);

    // Smooth progress indicator interval
    const progressInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to process document classification pipeline.');
      }

      const resultData = await response.json();
      setCurrentStageIndex(PIPELINE_STAGES.length - 1);
      
      setTimeout(() => {
        setUploading(false);
        navigate('result', resultData.document_id);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-12">
      <div className="glass p-8 rounded-2xl border border-dark-border space-y-8 relative overflow-hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Document</h2>
          <p className="text-gray-400 text-sm mt-1">Upload a PDF containing mixed pages to classify. Each page will be evaluated independently.</p>
        </div>

        {error && (
          <div className="p-4 rounded bg-brand-danger/10 border border-brand-danger/25 text-brand-danger text-sm">
            {error}
          </div>
        )}

        {!uploading ? (
          <div className="space-y-6">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-dark-border rounded-xl p-10 text-center hover:border-indigo-500/50 transition cursor-pointer bg-gray-950/20"
            >
              <input 
                type="file" 
                id="file-input" 
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden" 
              />
              <label htmlFor="file-input" className="cursor-pointer space-y-4 block">
                <span className="text-5xl block">📥</span>
                <span className="block font-medium text-lg">
                  {file ? file.name : "Drag and drop your PDF here, or browse"}
                </span>
                <span className="block text-xs text-gray-500">
                  Accepts exactly ONE PDF file. Mixed document pages are supported.
                </span>
              </label>
            </div>

            {file && (
              <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-white text-xs border border-dark-border rounded px-2.5 py-1"
                >
                  Clear
                </button>
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!file}
              className="w-full py-3 rounded-lg gradient-btn text-sm font-semibold tracking-wide disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Start Classification Ingestion
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-6 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Processing Document...</p>
              <h3 className="text-xl font-bold text-indigo-400">{PIPELINE_STAGES[currentStageIndex]}</h3>
            </div>

            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden border border-dark-border">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500">Executing pipeline orchestrator rules. Do not refresh this page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
