import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} border-indigo-500 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.2)]`}></div>
      <span className="text-xs text-cyan-400 font-mono mt-3 uppercase tracking-widest animate-pulse">Processing</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
      <p className="text-gray-400 text-sm mt-2">Loading interface elements...</p>
    </div>
  );
}

export default LoadingSpinner;
