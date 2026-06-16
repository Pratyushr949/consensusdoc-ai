import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Dashboard({ user, navigate }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve classified documents list.');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = async (docId, format) => {
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

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Classification Dashboard</h2>
          <p className="text-gray-400 text-sm">Welcome back, {user.username} ({user.role})</p>
        </div>
        <button 
          onClick={() => navigate('upload')}
          className="gradient-btn px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <span>＋</span> Upload New PDF
        </button>
      </div>

      {error && (
        <div className="p-4 rounded bg-brand-danger/10 border border-brand-danger/25 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm font-medium">Total Uploads</p>
          <p className="text-4xl font-bold mt-2">{documents.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm font-medium">Processed Cleanly</p>
          <p className="text-4xl font-bold mt-2 text-brand-success">
            {documents.filter(d => d.status === 'Processed' || d.status === 'Human Validated').length}
          </p>
        </div>
        <div className="glass p-6 rounded-2xl border border-dark-border">
          <p className="text-gray-400 text-sm font-medium">Requires Human Inspection</p>
          <p className="text-4xl font-bold mt-2 text-brand-warning">
            {documents.filter(d => d.status === 'Pending Review').length}
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="glass rounded-2xl border border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">Classified Documents</h3>
          <button 
            onClick={fetchDocuments}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            🔄 Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Loading document history...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">No classified documents found. Upload a PDF to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-gray-400 text-xs uppercase tracking-wider bg-gray-900/50">
                  <th className="px-6 py-4 font-medium">Document ID</th>
                  <th className="px-6 py-4 font-medium">Filename</th>
                  <th className="px-6 py-4 font-medium">Pages</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border text-sm">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/20 transition">
                    <td className="px-6 py-4 font-mono text-gray-300 text-xs">{doc.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{doc.filename}</td>
                    <td className="px-6 py-4 text-gray-300">{doc.pages_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.status === 'Processed' || doc.status === 'Human Validated'
                          ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                          : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        onClick={() => navigate('result', doc.id)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        View Results
                      </button>
                      <button 
                        onClick={() => handleDownload(doc.id, 'JSON')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-400/20 rounded px-2 py-1 bg-emerald-400/5"
                      >
                        JSON
                      </button>
                      <button 
                        onClick={() => handleDownload(doc.id, 'Excel')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-400/20 rounded px-2 py-1 bg-emerald-400/5"
                      >
                        Excel
                      </button>
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
