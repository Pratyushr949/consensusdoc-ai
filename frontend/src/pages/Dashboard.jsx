// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useToast } from '../components/ToastContext';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RefreshCw, 
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, underReview: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || 'Employee';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const docs = await docService.getDocuments();
      setDocuments(docs);
      
      // Calculate metrics on the fly from backend responses
      let total = docs.length;
      let underReview = 0;
      let approved = 0;
      let rejected = 0;

      docs.forEach(doc => {
        const docStatus = (doc.status || '').toLowerCase();
        if (docStatus === 'pending review' || docStatus === 'pending_review') {
          underReview++;
        } else if (docStatus === 'processed' || docStatus === 'human validated' || docStatus === 'human_validated' || docStatus === 'approved') {
          approved++;
        } else if (docStatus === 'rejected' || docStatus === 'failed') {
          rejected++;
        }
      });

      setMetrics({ total, underReview, approved, rejected });
    } catch (err) {
      console.error("Failed to fetch documents from API:", err);
      let errMsg = "Could not retrieve classified documents from server.";
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDownload = async (docId, format) => {
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

  const filteredDocs = documents.filter(doc => 
    (doc.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      
      {/* Header and Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Document Center
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, <span className="text-cyan-400 font-semibold">{username}</span> ({role})
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/upload')}
          className="gradient-btn px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group transition-all duration-300"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Metrics Cards - Enterprise SaaS style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Documents Card */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-350 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">
              Total Ingested
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{metrics.total}</span>
            <span className="text-xs text-gray-500">docs</span>
          </div>
        </div>

        {/* Under Review Card */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-350 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">
              Under Review
            </span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-400 tracking-tight">{metrics.underReview}</span>
            <span className="text-xs text-gray-500">pending</span>
          </div>
        </div>

        {/* Approved Card */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-350 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">
              Processed/Clean
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">{metrics.approved}</span>
            <span className="text-xs text-gray-500">resolved</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-red-500/40 transition-all duration-350 shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">
              Rejected / Failed
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-red-400 tracking-tight">{metrics.rejected}</span>
            <span className="text-xs text-gray-500">errors</span>
          </div>
        </div>

      </div>

      {/* Documents Grid / Table Section */}
      <div className="glass rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
        
        {/* Table Header Controls */}
        <div className="px-6 py-5 border-b border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-white">Ingested Document Streams</h3>
            <button 
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0b0e17]/80 border border-gray-800 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Querying distributed database...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-20 text-center text-gray-500 space-y-3">
            <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-medium">No classified files found matching search criteria.</p>
            <p className="text-xs text-gray-600">Start by uploading a document in the Ingestion menu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-950/45 font-mono">
                  <th className="px-6 py-4 font-semibold">Document ID</th>
                  <th className="px-6 py-4 font-semibold">Filename</th>
                  <th className="px-6 py-4 font-semibold text-center">Pages</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/15 transition group">
                    <td className="px-6 py-4 font-mono text-gray-400 select-all font-semibold">
                      {doc.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors">
                        {doc.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-300">
                      {doc.pages_count}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        doc.status === 'Processed' || doc.status === 'Human Validated' || doc.status === 'Processed'
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                          : doc.status === 'Pending Review'
                          ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20 animate-pulse'
                          : 'bg-red-500/5 text-red-400 border-red-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          doc.status === 'Processed' || doc.status === 'Human Validated' || doc.status === 'Processed'
                            ? 'bg-emerald-400' 
                            : doc.status === 'Pending Review'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button 
                          onClick={() => navigate(`/result/${doc.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-cyan-400 hover:text-cyan-400 font-bold transition flex items-center gap-1 text-gray-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Analysis</span>
                        </button>
                        
                        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
                          <button 
                            onClick={() => handleDownload(doc.id, 'JSON')}
                            className="px-2 py-1 hover:text-emerald-400 text-gray-400 hover:bg-gray-800 rounded transition font-semibold"
                            title="Download JSON Report"
                          >
                            JSON
                          </button>
                          <div className="w-[1px] h-3 bg-gray-800"></div>
                          <button 
                            onClick={() => handleDownload(doc.id, 'Excel')}
                            className="px-2 py-1 hover:text-emerald-400 text-gray-400 hover:bg-gray-800 rounded transition font-semibold"
                            title="Download Excel Report"
                          >
                            Excel
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
    </div>
  );
}

export default Dashboard;
