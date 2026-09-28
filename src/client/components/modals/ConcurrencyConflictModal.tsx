import React from 'react';

interface ConcurrencyConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  expectedVersion: number;
  currentVersion: number;
}

export const ConcurrencyConflictModal: React.FC<ConcurrencyConflictModalProps> = ({
  isOpen, onClose, onRefresh, expectedVersion, currentVersion
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in">
        <div className="flex items-center gap-3 text-amber-600 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-base font-bold text-slate-900">Concurrency Conflict (HTTP 409)</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          This ticket was modified by another operator while you were viewing it. Your changes were rejected to prevent overwriting updates.
        </p>
        <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-700 mb-6 border border-slate-200">
          <div>Your baseline version: <span className="text-red-600 font-semibold">{expectedVersion}</span></div>
          <div>Current server version: <span className="text-emerald-600 font-semibold">{currentVersion}</span></div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onRefresh} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-700">Refresh & Review</button>
        </div>
      </div>
    </div>
  );
};
