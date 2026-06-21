// frontend/src/pages/Result.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useToast } from '../components/ToastContext';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet,
  FileJson,
  Cpu
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Result() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResult = async () => {
    setLoading(true);
    setError('');
    if (!docId) {
      setError("No document ID specified.");
      setLoading(false);
      return;
    }
    
    try {
      const data = await docService.getDocument(docId);
      if (data) {
        setReport(data);
      } else {
        setError(`Could not find document classification results for ID '${docId}'.`);
      }
    } catch (err) {
      console.error("Failed to query document details:", err);
      let errMsg = "Failed to load document classification results.";
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [docId]);

  const handleDownload = async (format) => {
    const type = format.toLowerCase();
    addToast(`Preparing download for report ${docId} as ${format}...`, 'info');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/download/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download report as ${format}.`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${docId}.${type === 'json' ? 'json' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast(`Downloaded report for Document ${docId}!`, 'success');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error occurred during file download.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center min-h-[300px]">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Assembling page consensus maps...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12">
        <div className="glass p-8 rounded-2xl border border-red-500/20 text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl font-bold text-red-400">Error Loading Results</h3>
          <p className="text-gray-400 text-sm">{error || "No data returned."}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-semibold text-white transition-all duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasFlaggedPages = report.has_flagged_pages || report.pages?.some(p => p.status === 'Pending Review' || p.confidence < 0.75);

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      
      {/* Navigation & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mb-2 group transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Classification Analysis
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-mono">
            Document Stream Reference: <span className="text-indigo-400 font-semibold">{report.document_id || report.id}</span> | {report.filename}
          </p>
        </div>
        
        {/* Download buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleDownload('JSON')}
            className="px-4 py-2.5 border border-gray-800 bg-[#090D16]/40 hover:border-cyan-400/40 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 text-gray-300 shadow-md"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Download JSON</span>
          </button>
          
          <button 
            onClick={() => handleDownload('Excel')}
            className="px-4 py-2.5 border border-gray-800 bg-[#090D16]/40 hover:border-emerald-400/40 hover:text-emerald-400 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 text-gray-300 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Human Review Banner */}
      {hasFlaggedPages && (
        <div className="p-4.5 rounded-2xl bg-yellow-500/5 border border-yellow-500/25 text-yellow-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/10">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm text-yellow-200">Human Inspection Required</p>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Some pages in this document fell below the 75% confidence threshold and require manual operator validation.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/review')}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#090D16] font-bold rounded-xl text-xs transition-all duration-300 whitespace-nowrap"
          >
            Audit Review Queue
          </button>
        </div>
      )}

      {/* Segments Display */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Segmented Boundary Ranges</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {report.segments?.map((seg) => {
            const avgConf = seg.average_confidence !== undefined ? seg.average_confidence : 1.0;
            const isLowConf = avgConf < 0.75;
            const docType = seg.document_type || 'unknown';
            
            return (
              <div 
                key={seg.segment_id}
                className={`glass p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:border-gray-700/80 shadow-lg ${
                  isLowConf ? 'border-yellow-500/20' : 'border-gray-800/85'
                }`}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-mono">
                    Segment #{seg.segment_id}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    isLowConf 
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 animate-pulse' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    Avg Conf: {(avgConf * 100).toFixed(0)}%
                  </span>
                </div>
                
                <h4 className="text-xl font-black uppercase text-white tracking-wide font-sans">
                  {docType.replace('_', ' ')}
                </h4>
                
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Pages Covered: <span className="text-cyan-400 font-mono font-bold">{seg.pages?.join(', ')}</span> 
                  <span className="text-gray-500 font-normal"> ({seg.pages?.length} page{seg.pages?.length > 1 ? 's' : ''})</span>
                </p>
                
                {isLowConf && (
                  <div className="text-[10px] text-yellow-500 mt-3 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Flags active on page {seg.pages?.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pages breakdown detail list */}
      <div className="glass rounded-2xl border border-gray-800/85 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="px-6 py-5 border-b border-gray-800/60 bg-gray-950/20">
          <h3 className="font-bold text-lg text-white">Page-by-Page Decision Ledger</h3>
        </div>
        
        <div className="divide-y divide-gray-800/60">
          {report.pages?.map((p) => {
            const pageConf = p.confidence !== undefined ? p.confidence : p.confidence_score;
            const isLowConf = pageConf < 0.75;
            const pageType = p.document_type || p.predicted_category || 'unknown';
            
            return (
              <div 
                key={p.page_number} 
                className="p-6 hover:bg-gray-800/10 transition-colors flex flex-col md:flex-row justify-between gap-6 relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400 scale-y-0 group-hover:scale-y-100 transition-transform"></div>

                <div className="space-y-3.5 flex-1 max-w-4xl min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-base text-white bg-gray-900 border border-gray-800 px-3 py-1 rounded-xl font-mono">
                      Page {p.page_number}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold font-mono uppercase tracking-wider">
                      Segment Linkage: #{p.segment_id || '1'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="font-bold text-gray-500 font-mono uppercase tracking-wider text-[10px] block">
                      Pipeline Classification Proof:
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed italic bg-gray-950/20 p-3 rounded-xl border border-gray-850">
                      "{p.reasoning || "Page classification resolved by multi-agent consensus."}"
                    </p>
                  </div>
                </div>

                {/* Right side page status indicators */}
                <div className="flex flex-row md:flex-col md:items-end justify-between md:justify-center gap-4 min-w-[200px] shrink-0 border-t md:border-t-0 border-gray-855 pt-4 md:pt-0">
                  <div className="text-right">
                    <span className="text-xs font-black uppercase tracking-wider text-white bg-gray-900 border border-gray-855 px-3 py-1.5 rounded-xl block md:inline-block">
                      {pageType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                      isLowConf 
                        ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20' 
                        : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                    }`}>
                      Conf: {(pageConf * 100).toFixed(0)}%
                    </span>
                    
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      p.status === 'Approved' || p.status === 'Human Validated' || p.status === 'Processed' || p.status === 'processed' || p.status === 'overridden'
                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                        : 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Manual override action quick-link */}
                  {(p.status === 'Pending Review' || p.status === 'pending_review' || isLowConf) && p.status !== 'overridden' && (
                    <button 
                      onClick={() => navigate(`/override/${report.document_id || report.id}/${p.page_number}`)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline text-right transition-colors"
                    >
                      Override Category
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Result;
