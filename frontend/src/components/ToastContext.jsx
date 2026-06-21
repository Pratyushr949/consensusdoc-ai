// frontend/src/components/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Deck Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-xl transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-250 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-red-950/80 border-red-500/30 text-red-250 shadow-red-950/20'
                : toast.type === 'warning'
                ? 'bg-yellow-950/80 border-yellow-500/30 text-yellow-250 shadow-yellow-950/20'
                : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-250 shadow-indigo-950/20'
            }`}
          >
            {/* Status Icons */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            {/* Message Body */}
            <div className="flex-1 text-xs font-semibold leading-relaxed text-gray-250">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be called inside a ToastProvider');
  }
  return context;
}
