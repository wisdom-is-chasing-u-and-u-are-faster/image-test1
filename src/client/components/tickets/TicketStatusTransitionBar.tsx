import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { ResolveTicketModal } from './ResolveTicketModal';
import { ConcurrencyConflictModal } from '../modals/ConcurrencyConflictModal';

interface TransitionBarProps {
  ticket: Ticket;
  onStatusUpdated: (updatedTicket: Ticket) => void;
}

export const TicketStatusTransitionBar: React.FC<TransitionBarProps> = ({ ticket, onStatusUpdated }) => {
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{ expected: number; current: number } | null>(null);

  const allowedNext: Record<TicketStatus, TicketStatus[]> = {
    SUBMITTED: ['QUEUED', 'ASSIGNED'],
    QUEUED: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS', 'QUEUED'],
    IN_PROGRESS: ['PENDING_CUSTOMER', 'RESOLVED'],
    PENDING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED'],
    RESOLVED: ['CLOSED', 'IN_PROGRESS'],
    CLOSED: []
  };

  const nextOptions = allowedNext[ticket.status] || [];

  const handleTransition = async (targetStatus: TicketStatus, notes?: string) => {
    if (targetStatus === 'RESOLVED' && !notes) {
      setIsResolveModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/v1/tickets/${ticket.ticket_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          expected_version: ticket.version,
          resolution_notes: notes
        })
      });

      if (res.status === 409) {
        const err = await res.json();
        setConflictData({ expected: ticket.version, current: err.current_version });
        return;
      }

      const data = await res.json();
      onStatusUpdated(data);
    } catch (err) {
      console.error('Transition error', err);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase">Current State:</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">{ticket.status}</span>
        <span className="text-xs text-slate-400 font-mono">v{ticket.version}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Move to:</span>
        {nextOptions.map(st => (
          <button
            key={st}
            onClick={() => handleTransition(st)}
            className="px-3 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold rounded-md transition-colors"
          >
            {st}
          </button>
        ))}
      </div>

      <ResolveTicketModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onConfirm={(notes) => {
          setIsResolveModalOpen(false);
          handleTransition('RESOLVED', notes);
        }}
      />

      <ConcurrencyConflictModal
        isOpen={!!conflictData}
        expectedVersion={conflictData?.expected || ticket.version}
        currentVersion={conflictData?.current || ticket.version + 1}
        onClose={() => setConflictData(null)}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
};
