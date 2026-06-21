// frontend/src/pages/Override.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { docService } from '../services/api';
import { useToast } from '../components/ToastContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  FolderOpen,
  Cpu,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  { id: "invoice", name: "Invoice (Commercial invoices & bills)" },
  { id: "bank_statement", name: "Bank Statement (Financial account summaries)" },
  { id: "aadhaar", name: "Aadhaar Card (Indian Demographic UID ID)" },
  { id: "pan_card", name: "PAN Card (Income Tax Identity Card)" },
  { id: "passport", name: "Passport (International Travel Credentials)" },
  { id: "insurance_document", name: "Insurance Document (Policy binders & terms)" }
];

function Override() {
  const { docId, pageNum } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [document, setDocument] = useState(null);
  const [page, setPage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDocumentAndPage = async () => {
      setFetching(true);
      setError('');
      try {
        const doc = await docService.getDocument(docId);
        if (!doc) {
          setError(`No document found with ID matching '${docId}'`);
          return;
        }

        const pgNum = parseInt(pageNum);
        const pg = doc.pages?.find(p => p.page_number === pgNum);
        if (!pg) {
          setError(`Page ${pageNum} does not exist in Document ${docId}`);
          return;
        }

        setDocument(doc);
        setPage(pg);
        setSelectedCategory(pg.document_type || pg.predicted_category || '');
      } catch (err) {
        console.error("Failed to load document for override:", err);
        let errMsg = `Failed to fetch document ${docId} details from server.`;
        if (err.response && err.response.data && err.response.data.detail) {
          errMsg = err.response.data.detail;
        }
        setError(errMsg);
        addToast(errMsg, 'error');
      } finally {
        setFetching(false);
      }
    };

    fetchDocumentAndPage();
  }, [docId, pageNum]);

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a valid target classification category.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Execute post to /api/review-queue/override
      await docService.manualOverride(docId, pageNum, selectedCategory);
      setSuccess(true);
      addToast(`Successfully overridden Page ${pageNum} to category '${selectedCategory}'!`, 'success');
      
      // Redirect back to review queue
      setTimeout(() => {
        navigate('/review');
      }, 1200);
    } catch (err) {
      console.error("Failed to submit manual override:", err);
      let errMsg = 'Failed to submit category override to the server.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto w-full py-12">
        <div className="glass p-8 rounded-2xl border border-red-500/20 text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl font-bold text-red-400">Override Loading Error</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/review')}
            className="px-5 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-semibold text-white transition-all duration-300"
          >
            Return to Review Queue
          </button>
        </div>
      </div>
    );
  }

  if (fetching || !document || !page) {
    return (
      <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold">Retrieving node parameters from server...</p>
      </div>
    );
  }

  const origCategory = page.document_type || page.predicted_category || 'unknown';
  const origConfidence = page.confidence !== undefined ? page.confidence : page.confidence_score;

  return (
    <div className="max-w-xl mx-auto w-full py-6 animate-fade-in">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/review')}
        className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mb-4 group transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Return to Review Queue</span>
      </button>

      {/* Main glass panel */}
      <div className="glass p-8 rounded-2xl border border-gray-800/80 relative overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Override Applied Successfully</h3>
            <p className="text-gray-400 text-xs max-w-sm mx-auto">
              Page {pageNum} classification has been updated to <span className="text-cyan-400 font-bold uppercase font-mono">{selectedCategory}</span>. Page status marked as <span className="text-emerald-400 font-bold">Human Validated</span>.
            </p>
            <div className="text-[10px] text-gray-500 font-mono">
              Redirecting back to Review Queue...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOverride} className="space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-indigo-400" />
                <span>Manual Classification Override</span>
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                You are overriding page details for document stream <span className="text-indigo-300 font-semibold font-mono">{document.filename}</span>.
              </p>
            </div>

            {/* Target info card */}
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Document Reference ID:</span>
                <span className="font-mono text-gray-300 font-bold select-all">{document.document_id || document.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Target Page Number:</span>
                <span className="text-gray-300 font-bold">Page {pageNum} of {document.total_pages || document.pages_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Flagged Category:</span>
                <span className="font-bold text-yellow-500 uppercase font-mono">{origCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Original Confidence:</span>
                <span className="font-bold text-yellow-500 font-mono">{(origConfidence * 100).toFixed(0)}%</span>
              </div>
              <div className="pt-2 border-t border-gray-850">
                <span className="text-gray-500 font-semibold block mb-1">Low Confidence Flag Reason:</span>
                <p className="text-gray-400 italic bg-gray-950/20 p-2.5 rounded border border-gray-850">
                  "{page.reasoning || "Failed consensus safety check."}"
                </p>
              </div>
            </div>

            {/* Dropdown Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Correct Category Selection
              </label>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#0b0e17]/85 border border-gray-800 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                required
              >
                <option value="">-- Choose Category --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning alert */}
            <div className="p-3.5 rounded-xl bg-indigo-950/15 border border-indigo-900/30 flex items-start gap-3">
              <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                By submitting this override, you bypass the consensus confidence threshold. The override will update the Page classification to <span className="font-semibold text-gray-300">100% confidence</span> and rebuild consecutive segment boundaries.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/review')}
                disabled={loading}
                className="w-1/3 py-3 rounded-xl border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-400 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Applying Override...</span>
                  </>
                ) : (
                  <span>Submit Override Category</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default Override;
