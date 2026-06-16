import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Result({ user, docId, navigate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResult = async () => {
    if (!docId) {
      setError("No document ID specified.");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load classification results.');
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [docId]);

  const handleDownload = async (format) => {
    const type = format.toLowerCase();
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
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm">Loading document classification results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12">
        <div className="glass p-8 rounded-2xl border border-brand-danger/30 text-center space-y-4">
          <span className="text-4xl block">⚠️</span>
          <h3 className="text-xl font-bold text-brand-danger">Error Loading Results</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => navigate('dashboard')}
            className="px-4 py-2 bg-dark-border hover:bg-gray-800 rounded-lg text-sm text-white transition font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Back to Dashboard and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('dashboard')}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-3xl font-bold tracking-tight">Classification Results</h2>
          <p className="text-gray-400 text-sm font-mono mt-0.5">ID: {report.document_id} | {report.filename || 'Source Document'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleDownload('JSON')}
            className="px-4 py-2 border border-dark-border rounded-lg text-sm hover:bg-gray-800 transition font-medium text-gray-300"
          >
            Download JSON
          </button>
          <button 
            onClick={() => handleDownload('Excel')}
            className="px-4 py-2 border border-dark-border rounded-lg text-sm hover:bg-gray-800 transition font-medium text-gray-300"
          >
            Download Excel
          </button>
        </div>
      </div>

      {report.has_flagged_pages && (
        <div className="p-4 rounded-xl bg-brand-warning/10 border border-brand-warning/25 text-brand-warning flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Human Review Required</p>
              <p className="text-xs text-gray-300">Some pages in this document fell below the 75% confidence threshold and require audit validation.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('review')}
            className="px-4 py-2 bg-brand-warning hover:bg-amber-600 text-dark-bg font-bold rounded-lg text-xs transition"
          >
            Audit Review Queue
          </button>
        </div>
      )}

      {/* Visual Segments Grouping */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Document Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {report.segments?.map((seg) => (
            <div 
              key={seg.segment_id}
              className={`glass p-6 rounded-2xl border ${
                seg.average_confidence < 0.75 ? 'border-brand-warning/40' : 'border-dark-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Segment #{seg.segment_id}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  seg.average_confidence < 0.75 
                    ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' 
                    : 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                }`}>
                  Avg Conf: {(seg.average_confidence * 100).toFixed(0)}%
                </span>
              </div>
              <h4 className="text-xl font-bold uppercase text-white tracking-wide">{seg.document_type.replace('_', ' ')}</h4>
              <p className="text-sm text-gray-400 mt-2">
                Pages: {seg.pages?.join(', ')} ({seg.pages?.length} page{seg.pages?.length > 1 ? 's' : ''})
              </p>
              {seg.average_confidence < 0.75 && (
                <div className="text-xs text-brand-warning mt-3">
                  ⚠️ Flags active on page {seg.pages?.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pages Detail List */}
      <div className="glass rounded-2xl border border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-lg">Page-by-Page Breakdown</h3>
        </div>
        <div className="divide-y divide-dark-border">
          {report.pages?.map((p) => (
            <div key={p.page_number} className="p-6 hover:bg-gray-800/10 transition flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white">Page {p.page_number}</span>
                  <span className="text-xs text-gray-400">Segment ID: {p.segment_id || 'N/A'}</span>
                </div>
                <p className="text-sm text-gray-300"><span className="font-semibold text-gray-400">Reasoning:</span> {p.reasoning}</p>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-2 min-w-[200px]">
                <div className="text-right">
                  <span className="text-sm font-bold uppercase tracking-wider text-white bg-gray-900 border border-dark-border px-3 py-1 rounded-md block md:inline-block">
                    {p.document_type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 w-full">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    p.confidence < 0.75 
                      ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' 
                      : 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                  }`}>
                    Confidence: {(p.confidence * 100).toFixed(0)}%
                  </span>
                  
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    p.status === 'Processed' || p.status === 'Human Validated'
                      ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                      : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Result;
