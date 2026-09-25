import React, { useState } from 'react';

interface ResolveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

export const ResolveTicketModal: React.FC<ResolveTicketModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Resolve Incident</h3>
        <p className="text-xs text-slate-500 mb-4">
          Resolution notes are strictly required (minimum 10 characters) and will be recorded in the immutable audit ledger.
        </p>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="State the root cause and remediation steps taken..."
          className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700">Cancel</button>
          <button
            disabled={notes.trim().length < 10}
            onClick={() => onConfirm(notes)}
            className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
          >
            Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
};
