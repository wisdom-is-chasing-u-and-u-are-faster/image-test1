import React from 'react';
import { AuditLedgerEntry } from '../../types/ticket';
import { JsonDiffViewer } from './JsonDiffViewer';
import { CryptographicVerificationBadge } from './CryptographicVerificationBadge';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditLedgerEntry[];
}

export const AuditHistoryDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, entries }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Immutable Audit Ledger</h3>
          <p className="text-[11px] text-slate-500">Tamper-evident cryptographically chained history</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.map(e => (
          <div key={e.audit_id} className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{e.action_type}</span>
              <span className="text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</span>
            </div>
            <CryptographicVerificationBadge checksum={e.checksum} />
            <JsonDiffViewer diffPayload={e.diff_payload} />
          </div>
        ))}
      </div>
    </div>
  );
};
