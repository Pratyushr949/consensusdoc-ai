// frontend/src/pages/Upload.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useToast } from '../components/ToastContext';
import { 
  UploadCloud, 
  Trash2, 
  Play, 
  Cpu, 
  Loader2, 
  Activity,
  Layers
} from 'lucide-react';

const PIPELINE_STAGES = [
  "PDF Splitter (Initializing Document Boundaries)",
  "OCR Engine (Extracting Page Elements)",
  "Text Preprocessing (Cleaning Noise & Metadata)",
  "Agent 1 Ingestion (Llama 3.3 70B - Groq API)",
  "Agent 2 Ingestion (Llama 3.3 70B - Groq API)",
  "Agent 3 Ingestion (Llama 3.3 70B - Groq API)",
  "Agent 4 Ingestion (Llama 3.3 70B - Groq API)",
  "Agent 5 Ingestion (Llama 3.3 70B - Groq API)",
  "Voting Engine (Consensus Handshake)",
  "Confidence Engine (Calculating Metric Ratio)",
  "Reason Aggregator (Compiling Agent Descriptions)",
  "Confidence Threshold Checker (Evaluating < 75% Rule)",
  "Boundary Detector & Segment Builder (Grouping Consecutive Pages)",
  "Output Generator (Formatting JSON & Excel Records)"
];

function Upload() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Only standard PDF files are supported by the ingestion pipeline.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  const handleStartIngestion = async () => {
    if (!file) return;

    setUploading(true);
    setCurrentStageIndex(0);
    setError('');
    addToast('Starting document ingestion pipeline...', 'info');

    // Smooth visual loader tick interval (steps through stages 0 to 12)
    const pipelineTimer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    try {
      // Execute actual POST request to FastAPI endpoint via Axios
      const resultData = await docService.uploadPdf(file);
      
      clearInterval(pipelineTimer);
      setCurrentStageIndex(PIPELINE_STAGES.length - 1); // Jump to complete stage
      
      addToast('Consensus pipeline run completed successfully!', 'success');
      
      setTimeout(() => {
        setUploading(false);
        navigate(`/result/${resultData.document_id}`);
      }, 500);
    } catch (err) {
      clearInterval(pipelineTimer);
      console.error(err);
      
      let errMsg = 'Failed to process document classification pipeline.';
      if (err.response && err.response.data && err.response.data.message) {
        errMsg = err.response.data.message;
      } else if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      } else if (err.message) {
        errMsg = err.message;
      }
      
      setError(errMsg);
      addToast(errMsg, 'error');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-6 animate-fade-in">
      <div className="glass p-8 rounded-2xl border border-gray-800/80 relative overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>Document Ingestion</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Submit a multi-page PDF document. Our 5-agent Ray consensus cluster will segment, classify, and audit each page.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/25 text-red-200 text-xs mb-6">
            {error}
          </div>
        )}

        {!uploading ? (
          <div className="space-y-6">
            
            {/* Drag & Drop Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 relative group ${
                isDragActive 
                  ? 'border-cyan-400 bg-cyan-950/10' 
                  : file 
                  ? 'border-indigo-500/40 bg-indigo-950/5' 
                  : 'border-gray-800 hover:border-gray-700 bg-gray-950/25'
              }`}
            >
              <input 
                type="file" 
                id="pdf-picker"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden" 
              />
              
              <label htmlFor="pdf-picker" className="cursor-pointer space-y-4 block">
                <div className="w-14 h-14 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300">
                  <UploadCloud className="w-7 h-7 text-indigo-400" />
                </div>
                
                {file ? (
                  <div className="space-y-1">
                    <span className="block font-bold text-gray-100 text-sm">{file.name}</span>
                    <span className="block text-xs text-gray-400 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="block font-semibold text-gray-200 text-sm">
                      Drag and drop your PDF here, or <span className="text-cyan-400 hover:underline">browse</span>
                    </span>
                    <span className="block text-xs text-gray-500 font-mono">
                      Accepts exactly ONE PDF file containing mixed pages.
                    </span>
                  </div>
                )}
              </label>

              {file && (
                <button 
                  onClick={(e) => { e.preventDefault(); handleRemoveFile(); }}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Submit button */}
            <button 
              onClick={handleStartIngestion}
              disabled={!file}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider disabled:opacity-45 disabled:pointer-events-none"
            >
              <Play className="w-4 h-4" />
              <span>Start Consensus Ingestion Pipeline</span>
            </button>

          </div>
        ) : (
          /* Pipeline Execution Stage Animations */
          <div className="py-6 space-y-6 text-center animate-pulse">
            
            {/* Spinning Indicator */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
              <Cpu className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-bounce" />
                Pipeline Orchestrator Active
              </span>
              <p className="text-sm font-semibold text-gray-200">
                Processing Document: <span className="text-white font-mono">{file.name}</span>
              </p>
              
              <h3 className="text-lg font-bold text-white transition-all duration-300">
                Stage {currentStageIndex + 1}/14:
                <span className="text-indigo-400 block text-base font-semibold mt-1">
                  {PIPELINE_STAGES[currentStageIndex]}
                </span>
              </h3>
            </div>

            {/* Custom Premium progress bar */}
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="w-full bg-gray-950 border border-gray-800 rounded-full h-3 overflow-hidden p-[1.5px]">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300 relative"
                  style={{ width: `${((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/40 blur-xs animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>0%</span>
                <span>{(parseFloat(((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100).toFixed(0))}% COMPLETED</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 bg-gray-900/35 border border-gray-800/40 p-3 rounded-lg max-w-sm mx-auto">
              Agents are executing distributed OCR segment boundaries. Do not interrupt connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
