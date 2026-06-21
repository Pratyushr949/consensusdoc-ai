import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { addToast } = useToast();
  
  const [documents, setDocuments] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, underReview: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch own uploaded documents
      const docs = await docService.getDocuments();
      setDocuments(docs);

      // 2. Fetch pending reviews for this employee's uploads
      const queue = await docService.getReviewQueue();
      setReviewItems(queue);

      // 3. Compile metrics
      let total = docs.length;
      let underReview = 0;
      let approved = 0;

      docs.forEach(doc => {
        const status = (doc.status || '').toLowerCase();
        if (status === 'pending review' || status === 'pending_review') {
          underReview++;
        } else if (status === 'processed' || status === 'human validated' || status === 'human_validated') {
          approved++;
        }
      });

      setMetrics({ total, underReview, approved });
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve dashboard details from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (docId, format) => {
    const type = format.toLowerCase();
    addToast(`Preparing report download for Document ${docId}...`, 'info');
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/download/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Download failed.');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${docId}.${type === 'json' ? 'json' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Download completed successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Error occurred while downloading report.', 'error');
    }
  };

  return (
    <div className="space-y-8 py-2 animate-fade-in text-gray-200">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Employee Console
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Welcome back, <span className="text-cyan-400 font-semibold">{username}</span> (Employee)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchDashboardData}
            title="Refresh Console"
            className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => navigate('/upload')}
            className="gradient-btn px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 group transition-all duration-300"
          >
            <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">My Ingested Docs</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{metrics.total}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-yellow-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">Pending Review</span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-400 tracking-tight">{metrics.underReview}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">Processed / Clean</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">{metrics.approved}</span>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: My Uploaded Documents Table */}
        <div className="lg:col-span-2 glass rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-gray-800/60">
            <h3 className="font-bold text-base text-white">My Ingested Streams</h3>
          </div>
          
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-semibold tracking-wider font-mono">Querying database...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center text-gray-500 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs font-semibold font-mono">No documents found.</p>
              <button 
                onClick={() => navigate('/upload')}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Upload your first PDF
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider bg-gray-950/45 font-mono">
                    <th className="px-5 py-3.5 font-semibold">Filename</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Pages</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-[11px]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-800/10 transition group">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-200 truncate max-w-[200px]" title={doc.filename}>
                          {doc.filename}
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono block select-all mt-0.5">{doc.id}</span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-gray-400">
                        {doc.pages_count}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          doc.status === 'Processed' || doc.status === 'Human Validated'
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15' 
                            : doc.status === 'Pending Review'
                            ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/15 animate-pulse'
                            : 'bg-red-500/5 text-red-400 border-red-500/15'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/result/${doc.id}`)}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-cyan-400 hover:text-cyan-400 text-gray-400 transition"
                            title="View Analysis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
                            <button 
                              onClick={() => handleDownload(doc.id, 'JSON')}
                              className="px-1.5 py-0.5 hover:text-cyan-400 text-[9px] font-mono hover:bg-gray-800 rounded transition"
                              title="Download JSON"
                            >
                              JSON
                            </button>
                            <button 
                              onClick={() => handleDownload(doc.id, 'Excel')}
                              className="px-1.5 py-0.5 hover:text-cyan-400 text-[9px] font-mono hover:bg-gray-800 rounded transition"
                              title="Download Excel"
                            >
                              XLSX
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Override / Review Queue */}
        <div className="glass rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="px-6 py-5 border-b border-gray-800/60">
            <h3 className="font-bold text-base text-white">Override Queue</h3>
          </div>
          
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-[10px] font-mono">Loading queue...</p>
            </div>
          ) : reviewItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto" />
              <p className="text-xs font-semibold font-mono">Review queue clean!</p>
              <p className="text-[10px] text-gray-600">No pages require override verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50 max-h-[400px] overflow-y-auto">
              {reviewItems.map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-800/10 transition space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-400 font-bold">Page {item.page_number}</span>
                    <span className="text-[10px] font-semibold text-yellow-400 tracking-wider uppercase bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                      {(item.confidence * 100).toFixed(1)}% Conf
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-gray-400">
                    <span className="text-gray-500 block font-mono text-[9px]">Document ID: {item.document_id}</span>
                    <span className="block mt-1 font-semibold text-gray-300">Predicted Type: {item.predicted_category}</span>
                  </div>

                  <button 
                    onClick={() => navigate(`/override/${item.document_id}/${item.page_number}`)}
                    className="w-full py-1.5 mt-1 rounded-lg text-[10px] font-bold font-mono uppercase bg-yellow-600 hover:bg-yellow-500 text-white transition flex items-center justify-center gap-1"
                  >
                    <span>Override Classification</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default EmployeeDashboard;
