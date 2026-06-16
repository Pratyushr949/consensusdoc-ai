import React, { useState } from 'react';

function Audit({ navigate }) {
  // Mock audit history and DB query history for front-end demonstration (pre-backend connection)
  const [logs] = useState([
    { id: 'log-001', user: 'admin_1', action: 'Download JSON', details: 'Downloaded final structured JSON output for Doc ID: doc-101', created_at: '2026-06-15 15:02' },
    { id: 'log-002', user: 'john_doe', action: 'Upload Document', details: 'Uploaded document compliance_report_june.pdf (ID: doc-102)', created_at: '2026-06-16 09:12' },
    { id: 'log-003', user: 'admin_1', action: 'Human Override', details: 'Overrode Page 4 of doc-102 from "aadhaar" to "passport" with status set to "Human Validated"', created_at: '2026-06-16 10:30' },
    { id: 'log-004', user: 'john_doe', action: 'Download Excel', details: 'Downloaded final Excel report for Doc ID: doc-103', created_at: '2026-06-16 11:47' }
  ]);

  const [dbQueries] = useState([
    { table: 'users', row_count: 5, description: 'User credentials and roles metadata' },
    { table: 'documents', row_count: 24, description: 'Uploaded document metadata and path mappings' },
    { table: 'page_classifications', row_count: 98, description: 'Page classification, confidence and reasoning values' },
    { table: 'review_queue', row_count: 2, description: 'Pending and human validated audit entries' },
    { table: 'audit_logs', row_count: 142, description: 'System log trails mapping user actions' },
    { table: 'download_history', row_count: 36, description: 'Download logs for JSON and Excel files' }
  ]);

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Audit Dashboard</h2>
        <p className="text-gray-400 text-sm mt-0.5">Audit processing history, download history, and direct database counts (restricted to administrators).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Audit Log table (2 cols width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl border border-dark-border overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-lg">System Action Trail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-gray-400 text-xs uppercase tracking-wider bg-gray-900/50">
                    <th className="px-6 py-3.5 font-medium">User</th>
                    <th className="px-6 py-3.5 font-medium">Action</th>
                    <th className="px-6 py-3.5 font-medium">Details</th>
                    <th className="px-6 py-3.5 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border text-sm">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800/10 transition">
                      <td className="px-6 py-4 font-semibold text-white">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          log.action.includes('Upload') 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : log.action.includes('Override')
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{log.details}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono">{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Database History overview (1 col width) */}
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-dark-border overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-lg">Database History</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Direct database tables breakdown and current row mappings:</p>
              
              <div className="space-y-3">
                {dbQueries.map((db, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-dark-border bg-gray-950/20 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white font-mono">{db.table}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{db.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {db.row_count} rows
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => alert("Connecting to database console...")}
                className="w-full py-2.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 text-xs font-semibold tracking-wider transition uppercase"
              >
                Access DB Console (restricted)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Audit;
