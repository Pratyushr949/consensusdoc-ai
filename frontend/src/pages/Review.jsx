// frontend/src/pages/Review.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useToast } from '../components/ToastContext';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  FileCheck,
  RotateCw
} from 'lucide-react';

function Review() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const reviewItems = await docService.getReviewQueue();
      setQueue(reviewItems);
    } catch (err) {
      console.error("Failed to fetch review queue:", err);
      let errMsg = "Could not query pending review items from server.";
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Human Review Queue
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Audit and manually resolve document page classifications that fell below the <span className="text-cyan-400 font-semibold font-mono">75%</span> confidence threshold.
          </p>
        </div>
        
        <button 
          onClick={loadQueue}
          title="Refresh Queue"
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="glass p-20 text-center rounded-2xl border border-gray-800 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-gray-400">Querying consensus queue items...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="glass p-16 text-center rounded-2xl border border-gray-800 bg-emerald-950/5 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Review Queue Clear</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
            Excellent! All classified pages exceed the 75% confidence threshold and have been processed cleanly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>Currently displaying {queue.length} document pages requiring human override</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {queue.map((item, idx) => {
              // Normalize keys to support both database and JSON structures
              const docId = item.document_id;
              const pageNum = item.page_number;
              const confidence = item.confidence !== undefined ? item.confidence : item.confidence_score;
              const category = item.document_type || item.predicted_category || 'unknown';
              const reasoningText = item.reasoning || 'No explanation provided by agents.';
              
              const confidencePercent = (confidence * 100).toFixed(0);
              
              return (
                <div 
                  key={`${docId}-${pageNum}-${idx}`} 
                  className="glass p-6 rounded-2xl border border-gray-800/80 hover:border-gray-700/80 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg shadow-black/10 hover:shadow-black/25 relative overflow-hidden group"
                >
                  {/* Subtle edge neon light */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-blue-500 to-cyan-400"></div>

                  <div className="space-y-3.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-base text-white bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 font-mono">
                        Page {pageNum}
                      </span>
                      
                      <div className="text-xs text-gray-400 truncate font-semibold font-mono">
                        ID: {docId} {item.filename ? `• ${item.filename}` : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 font-semibold uppercase tracking-wider block font-mono">Predicted Type</span>
                        <span className="font-bold text-gray-200 text-sm uppercase tracking-wide">
                          {category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 font-semibold uppercase tracking-wider block font-mono">Confidence Level</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-16 bg-gray-900 border border-gray-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-yellow-500 h-full rounded-full" 
                              style={{ width: `${confidencePercent}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-yellow-500 font-mono text-sm">
                            {confidencePercent}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 font-semibold uppercase tracking-wider block font-mono">Pipeline Status</span>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-yellow-500/5 text-yellow-400 border border-yellow-500/15 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          <Clock className="w-2.5 h-2.5" />
                          Pending Review
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-950/40 border border-gray-850 text-xs text-gray-300 space-y-1">
                      <span className="font-bold text-gray-500 font-mono uppercase tracking-wider block text-[10px]">
                        Multi-Agent Consensus Reasoning:
                      </span>
                      <p className="italic leading-relaxed">"{reasoningText}"</p>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex md:flex-col items-stretch justify-center w-full md:w-auto gap-3 shrink-0">
                    <button 
                      onClick={() => navigate(`/result/${docId}`)}
                      className="px-4 py-2.5 bg-gray-900 border border-gray-855 hover:border-indigo-500/40 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all duration-300 flex-1 md:flex-none text-center"
                    >
                      Inspect Document
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/override/${docId}/${pageNum}`)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md shadow-indigo-900/15 flex items-center justify-center gap-1.5 flex-1 md:flex-none group"
                    >
                      <span>Override Category</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default Review;
