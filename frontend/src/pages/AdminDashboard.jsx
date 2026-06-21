import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { docService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { 
  FileText, 
  Users, 
  RefreshCw, 
  ShieldAlert, 
  Eye, 
  History, 
  Search
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Fallback Mock Data to prevent page crash on API failure
const MOCK_DOCUMENTS = [
  { id: 'mock-doc-1', filename: 'Mock_Invoice_1.pdf', pages_count: 1, status: 'Processed', created_at: Date.now() },
  { id: 'mock-doc-2', filename: 'Mock_Bank_Statement.pdf', pages_count: 2, status: 'Human Validated', created_at: Date.now() - 3600000 }
];

const MOCK_EMPLOYEES = [
  { id: 'mock-emp-1', username: 'mock_employee_1', email: 'employee1@company.com', created_at: new Date().toISOString() }
];

const MOCK_OVERRIDES = [
  { employee: 'mock_employee_1', document_id: 'mock-doc-2', page_number: 2, original_category: 'aadhaar', new_category: 'passport', timestamp: new Date().toISOString() }
];

const MOCK_AUDITS = [
  { id: 'mock-audit-1', action: 'USER_LOGIN', user_id: 'mock-emp-1', document_id: null, page_number: null, old_value: null, new_value: 'mock_employee_1', timestamp: new Date().toISOString() }
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('docs');
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [overrideHistory, setOverrideHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorState, setErrorState] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorState(null);
    
    // 1. Fetch system wide documents
    try {
      const docs = await docService.getDocuments();
      setDocuments(Array.isArray(docs) ? docs : MOCK_DOCUMENTS);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments(MOCK_DOCUMENTS);
      addToast('Failed to fetch documents. Loading mock data.', 'warning');
    }

    // 2. Fetch employee users list
    try {
      const emps = await adminService.getEmployees();
      setEmployees(Array.isArray(emps) ? emps : MOCK_EMPLOYEES);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees(MOCK_EMPLOYEES);
      addToast('Failed to fetch employees. Loading mock data.', 'warning');
    }

    // 3. Fetch manual override history
    try {
      const history = await adminService.getOverrideHistory();
      setOverrideHistory(Array.isArray(history) ? history : MOCK_OVERRIDES);
    } catch (err) {
      console.error("Error fetching override history:", err);
      setOverrideHistory(MOCK_OVERRIDES);
      addToast('Failed to fetch override history. Loading mock data.', 'warning');
    }

    // 4. Fetch enterprise audit logs
    try {
      const logs = await adminService.getAuditLogs();
      setAuditLogs(Array.isArray(logs) ? logs : MOCK_AUDITS);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setAuditLogs(MOCK_AUDITS);
      addToast('Failed to fetch security audits. Loading mock data.', 'warning');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
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

  // Safe metrics calculations with fallback to 0
  const totalUploads = documents?.length || 0;
  const activeEmpCount = employees?.length || 0;
  const totalOverrides = overrideHistory?.length || 0;
  const totalAuditEntries = auditLogs?.length || 0;

  if (errorState) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-red-200">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-red-400">
          <ShieldAlert className="w-6 h-6" />
          Operations Center Error
        </h3>
        <p className="text-sm">{errorState.message || 'An error occurred while rendering the dashboard.'}</p>
        <button 
          onClick={fetchAdminData}
          className="mt-4 px-4 py-2 bg-red-900/40 border border-red-500/20 hover:bg-red-800/40 rounded-lg text-xs font-semibold"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 animate-fade-in text-gray-200">
      
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Administrative Operations
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Welcome back, <span className="text-indigo-400 font-semibold">{username || 'Administrator'}</span> (Administrator)
          </p>
        </div>
        
        <button 
          onClick={fetchAdminData}
          title="Refresh Operations Center"
          className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all self-end sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Ingested */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">System Ingested</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{totalUploads}</span>
            <span className="text-xs text-gray-500">runs</span>
          </div>
        </div>

        {/* Employees */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">Active Employees</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Users className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-cyan-400 tracking-tight">{activeEmpCount}</span>
            <span className="text-xs text-gray-500">users</span>
          </div>
        </div>

        {/* Overrides */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-yellow-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">Override Events</span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400"><History className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-400 tracking-tight">{totalOverrides}</span>
            <span className="text-xs text-gray-500">audits</span>
          </div>
        </div>

        {/* Audit Log entries */}
        <div className="glass p-5 rounded-2xl border border-gray-800/80 relative overflow-hidden group hover:border-red-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-mono">Security Actions</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><ShieldAlert className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-red-400 tracking-tight">{totalAuditEntries}</span>
            <span className="text-xs text-gray-500">entries</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Grid Controls */}
      <div className="glass rounded-2xl border border-gray-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Navigation Tabs */}
        <div className="px-6 pt-5 border-b border-gray-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-[#090D16]/90 p-1 border border-gray-850 rounded-xl">
            <button 
              onClick={() => { setActiveTab('docs'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all font-mono uppercase tracking-wider ${activeTab === 'docs' ? 'bg-indigo-600/40 text-white border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              System Docs
            </button>
            <button 
              onClick={() => { setActiveTab('employees'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all font-mono uppercase tracking-wider ${activeTab === 'employees' ? 'bg-indigo-600/40 text-white border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Employees
            </button>
            <button 
              onClick={() => { setActiveTab('overrides'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all font-mono uppercase tracking-wider ${activeTab === 'overrides' ? 'bg-indigo-600/40 text-white border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Override Logs
            </button>
            <button 
              onClick={() => { setActiveTab('audit'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all font-mono uppercase tracking-wider ${activeTab === 'audit' ? 'bg-indigo-600/40 text-white border border-indigo-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Security Audits
            </button>
          </div>

          <div className="relative max-w-xs w-full mb-3 md:mb-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0b0e17]/85 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Tab Body rendering */}
        {loading ? (
          <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-semibold tracking-wider font-mono">Loading operations dashboard...</p>
          </div>
        ) : (
          <div className="p-6">
            
            {/* View 1: System Docs */}
            {activeTab === 'docs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase bg-gray-950/45 font-mono">
                      <th className="px-5 py-3">Document ID</th>
                      <th className="px-5 py-3">Filename</th>
                      <th className="px-5 py-3 text-center">Pages</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-[11px]">
                    {(documents || []).filter(d => 
                      (d?.filename || 'Unnamed Document').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (d?.id || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((doc) => (
                      <tr key={doc.id || Math.random()} className="hover:bg-gray-850/20 transition group">
                        <td className="px-5 py-3 font-mono text-gray-400 font-bold select-all">{doc.id || 'N/A'}</td>
                        <td className="px-5 py-3 font-semibold">{doc.filename || 'Unnamed Document'}</td>
                        <td className="px-5 py-3 text-center font-bold text-gray-400">{doc.pages_count || 0}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            doc.status === 'Processed' || doc.status === 'Human Validated'
                              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15' 
                              : 'bg-yellow-500/5 text-yellow-400 border-yellow-500/15'
                          }`}>
                            {doc.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {doc.id && (
                              <>
                                <button 
                                  onClick={() => navigate(`/result/${doc.id}`)}
                                  className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-indigo-400 hover:text-indigo-400 text-gray-400 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDownload(doc.id, 'JSON')}
                                  className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 hover:text-cyan-400 text-[9px] font-mono rounded"
                                >
                                  JSON
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 2: Employees */}
            {activeTab === 'employees' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase bg-gray-950/45 font-mono">
                      <th className="px-5 py-3">User ID</th>
                      <th className="px-5 py-3">Username</th>
                      <th className="px-5 py-3">Email Address</th>
                      <th className="px-5 py-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-[11px]">
                    {(employees || []).filter(e => 
                      (e?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (e?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((emp) => (
                      <tr key={emp.id || Math.random()} className="hover:bg-gray-850/20 transition">
                        <td className="px-5 py-3 font-mono text-gray-500">{emp.id || 'N/A'}</td>
                        <td className="px-5 py-3 font-bold text-gray-200">{emp.username || 'N/A'}</td>
                        <td className="px-5 py-3 text-gray-300 font-mono">{emp.email || 'N/A'}</td>
                        <td className="px-5 py-3 font-mono text-gray-400">
                          {(() => {
                            try {
                              return emp.created_at ? new Date(emp.created_at).toLocaleString() : 'N/A';
                            } catch (err) {
                              return 'N/A';
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 3: Override History */}
            {activeTab === 'overrides' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase bg-gray-950/45 font-mono">
                      <th className="px-5 py-3">Operator</th>
                      <th className="px-5 py-3">Document ID</th>
                      <th className="px-5 py-3 text-center">Page</th>
                      <th className="px-5 py-3">Original Category</th>
                      <th className="px-5 py-3">New Category</th>
                      <th className="px-5 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-[11px]">
                    {(overrideHistory || []).filter(o => 
                      (o?.employee || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (o?.document_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (o?.new_category || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((log, index) => (
                      <tr key={index} className="hover:bg-gray-850/20 transition">
                        <td className="px-5 py-3 text-cyan-400 font-bold">{log.employee || 'Unknown'}</td>
                        <td className="px-5 py-3 font-mono text-gray-400 font-bold select-all">{log.document_id || 'N/A'}</td>
                        <td className="px-5 py-3 text-center font-bold text-gray-200">{log.page_number || 0}</td>
                        <td className="px-5 py-3 font-mono text-red-400">{log.original_category || 'N/A'}</td>
                        <td className="px-5 py-3 font-mono text-emerald-400 font-bold">{log.new_category || 'N/A'}</td>
                        <td className="px-5 py-3 font-mono text-gray-500">
                          {(() => {
                            try {
                              return log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                            } catch (err) {
                              return 'N/A';
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 4: Security Audits */}
            {activeTab === 'audit' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase bg-gray-950/45 font-mono">
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">User ID</th>
                      <th className="px-5 py-3">Details</th>
                      <th className="px-5 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-[11px]">
                    {(auditLogs || []).filter(a => 
                      (a?.action || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (a?.old_value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (a?.new_value || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((log) => (
                      <tr key={log.id || Math.random()} className="hover:bg-gray-850/20 transition">
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono border ${
                            log.action === 'USER_LOGIN' 
                              ? 'bg-blue-500/5 text-blue-400 border-blue-500/15'
                              : log.action === 'MANUAL_OVERRIDE'
                              ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/15'
                              : log.action === 'DOCUMENT_UPLOAD'
                              ? 'bg-purple-500/5 text-purple-400 border-purple-500/15'
                              : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15'
                          }`}>
                            {log.action || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-gray-500 select-all">{log.user_id || 'SYSTEM'}</td>
                        <td className="px-5 py-3 text-gray-300 font-mono">
                          {log.document_id && `Doc: ${log.document_id} `}
                          {log.page_number && `P. ${log.page_number} `}
                          {log.old_value && `[${log.old_value} -> ${log.new_value}]`}
                        </td>
                        <td className="px-5 py-3 font-mono text-gray-400">
                          {(() => {
                            try {
                              return log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                            } catch (err) {
                              return 'N/A';
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

export default AdminDashboard;
