import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading system components...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
