import React, { useState } from 'react';

const CATEGORIES = [
  { id: "invoice", name: "Invoice" },
  { id: "bank_statement", name: "Bank Statement" },
  { id: "aadhaar", name: "Aadhaar Card" },
  { id: "pan_card", name: "PAN Card" },
  { id: "passport", name: "Passport" },
  { id: "insurance_document", name: "Insurance Document" }
];

function Review({ user, navigate }) {
  // Mock review queue matching storage/review_queue/queue.json
  const [queue, setQueue] = useState([
    { document_id: 'doc-102', filename: 'compliance_report_june.pdf', page_number: 4, document_type: 'aadhaar', confidence: 0.52, reasoning: 'Unclear biometrics scan. Low resolution demographic metadata.', status: 'Pending Review' },
    { document_id: 'doc-104', filename: 'invoice_batch_9.pdf', page_number: 1, document_type: 'invoice', confidence: 0.71, reasoning: 'Flipped layout orientation. Blurred line item calculations.', status: 'Pending Review' }
  ]);

  const [selectedCategories, setSelectedCategories] = useState({}); // { 'doc-102-4': 'pan_card' }

  const handleCategoryChange = (docId, pageNum, val) => {
    setSelectedCategories(prev => ({
      ...prev,
      [`${docId}-${pageNum}`]: val
    }));
  };

  const handleOverride = (item) => {
    const key = `${item.document_id}-${item.page_number}`;
    const selected = selectedCategories[key];

    if (!selected) {
      alert("Please select a valid document category to override.");
      return;
    }

    // Update state to simulate Override Engine execution (pre-backend connection)
    setQueue(prev => prev.map(q => {
      if (q.document_id === item.document_id && q.page_number === item.page_number) {
        return {
          ...q,
          document_type: selected,
          status: 'Human Validated',
          confidence: 1.0
        };
      }
      return q;
    }));

    alert(`Classification overridden. Category updated to '${selected}' and status set to 'Human Validated'.`);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Human Review Queue</h2>
        <p className="text-gray-400 text-sm mt-0.5">Audit and resolve document classifications that fell below the 75% confidence threshold.</p>
      </div>

      {queue.filter(q => q.status === 'Pending Review').length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-dark-border">
          <span className="text-5xl block mb-4">🎉</span>
          <h3 className="text-xl font-bold text-white">Review Queue Clear</h3>
          <p className="text-gray-400 text-sm mt-1">All classifications meet or exceed the 75% confidence threshold.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((item, idx) => {
            const key = `${item.document_id}-${item.page_number}`;
            const selected = selectedCategories[key] || '';
            
            return (
              <div 
                key={idx} 
                className={`glass p-6 rounded-2xl border transition flex flex-col md:flex-row justify-between gap-6 ${
                  item.status === 'Human Validated' ? 'border-brand-success/40 bg-brand-success/5' : 'border-dark-border'
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-white">Page {item.page_number}</span>
                    <span className="text-xs text-gray-400 font-mono">Doc ID: {item.document_id} ({item.filename})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md text-sm text-gray-300">
                    <p><span className="text-gray-500 font-medium">Flagged Classification:</span> <span className="font-semibold text-white uppercase">{item.document_type}</span></p>
                    <p><span className="text-gray-500 font-medium">Confidence:</span> <span className="font-semibold text-brand-warning">{(item.confidence * 100).toFixed(0)}%</span></p>
                  </div>

                  <p className="text-sm text-gray-300"><span className="text-gray-500 font-medium">Aggregated Reason:</span> {item.reasoning}</p>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-4 min-w-[250px]">
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Human Validated' 
                        ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                        : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {item.status === 'Pending Review' ? (
                    <div className="space-y-3 w-full">
                      <select 
                        value={selected}
                        onChange={(e) => handleCategoryChange(item.document_id, item.page_number, e.target.value)}
                        className="w-full px-3 py-2 rounded bg-dark-bg border border-dark-border focus:border-indigo-500 focus:outline-none text-white text-sm"
                      >
                        <option value="">-- Select Correct Category --</option>
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      
                      <button 
                        onClick={() => handleOverride(item)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition shadow-md"
                      >
                        Submit Override Category
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-brand-success font-semibold flex items-center gap-1.5">
                      <span>✓</span> Classification Overridden
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Review;
