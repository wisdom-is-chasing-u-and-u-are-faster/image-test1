import React, { useState, useEffect } from 'react';
import { Ticket, AuditLedgerEntry } from '../../types/ticket';
import { TicketCard } from './TicketCard';
import { LiveKpiRibbon } from './LiveKpiRibbon';
import { TicketStatusTransitionBar } from '../tickets/TicketStatusTransitionBar';
import { AuditHistoryDrawer } from '../tickets/AuditHistoryDrawer';

interface QueueSplitViewProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  onTicketUpdated?: (ticket: Ticket) => void;
  onRefresh?: () => void;
}

export const QueueSplitView: React.FC<QueueSplitViewProps> = ({ tickets, onSelectTicket, onTicketUpdated, onRefresh }) => {
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.ticket_id || null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  useEffect(() => {
    if (!selectedId && tickets.length > 0) {
      setSelectedId(tickets[0].ticket_id);
    }
  }, [tickets, selectedId]);

  const selectedTicket = tickets.find(t => t.ticket_id === selectedId) || tickets[0];

  useEffect(() => {
    if (selectedTicket && onSelectTicket) {
      onSelectTicket(selectedTicket);
    }
  }, [selectedId]);

  const handleUpdated = (updated: Ticket) => {
    if (onTicketUpdated) {
      onTicketUpdated(updated);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-200';
      case 'P2': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'P3': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const mockAuditEntries: AuditLedgerEntry[] = selectedTicket ? [
    {
      audit_id: `aud-${selectedTicket.ticket_id}-1`,
      ticket_id: selectedTicket.ticket_id,
      action_type: 'TICKET_CREATED',
      actor_id: selectedTicket.requester_id,
      timestamp: selectedTicket.created_at,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      old_state: null,
      new_state: { status: 'SUBMITTED', priority: selectedTicket.priority },
      diff_payload: { status: { old: null, new: 'SUBMITTED' } }
    },
    ...(selectedTicket.version > 1 ? [
      {
        audit_id: `aud-${selectedTicket.ticket_id}-2`,
        ticket_id: selectedTicket.ticket_id,
        action_type: 'STATUS_TRANSITION',
        actor_id: 'agent-system-service',
        timestamp: selectedTicket.updated_at,
        checksum: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        old_state: { status: 'SUBMITTED', version: 1 },
        new_state: { status: selectedTicket.status, version: selectedTicket.version },
        diff_payload: { status: { old: 'SUBMITTED', new: selectedTicket.status } }
      }
    ] : [])
  ] : [];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agent Triage Workbench</h1>
          <p className="text-xs text-slate-500">Live operational queue with automated SLA countdowns and skill routing</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Queue
          </button>
        )}
      </div>

      <LiveKpiRibbon
        assignedToMe={tickets.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length}
        unassigned={tickets.filter(t => t.status === 'QUEUED' || t.status === 'SUBMITTED').length}
        slaWarning={tickets.filter(t => t.sla_resolve_status === 'RUNNING').length}
        breached={tickets.filter(t => t.sla_resolve_status === 'BREACHED').length}
      />

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-[540px]">
        {/* Left Column: Triage Queue */}
        <div className="col-span-5 border border-slate-200 bg-slate-50/50 rounded-xl p-4 overflow-y-auto space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Queue ({tickets.length})</h3>
            <span className="text-[11px] text-slate-500">Shortcuts: J/K navigate</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No tickets found in active queue.</div>
            ) : (
              tickets.map(t => (
                <TicketCard
                  key={t.ticket_id}
                  ticket={t}
                  isSelected={t.ticket_id === selectedTicket?.ticket_id}
                  onSelect={() => setSelectedId(t.ticket_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & Actions */}
        <div className="col-span-7 border border-slate-200 bg-white rounded-xl p-6 overflow-y-auto flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        #{selectedTicket.ticket_number}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                        {selectedTicket.priority} Priority
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedTicket.category || 'General'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedTicket.title}</h2>
                  </div>
                  <button
                    onClick={() => setIsAuditDrawerOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    🛡️ Audit Ledger
                  </button>
                </div>

                {/* SLA Monitor Bar */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 font-medium">SLA Ack Deadline:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedTicket.sla_ack_deadline ? new Date(selectedTicket.sla_ack_deadline).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">SLA Resolve Deadline:</span>
                    <p className="font-semibold text-slate-800">
                      {selectedTicket.sla_resolve_deadline ? new Date(selectedTicket.sla_resolve_deadline).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="prose prose-sm text-slate-700 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Incident Description</h4>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* FSM Lifecycle Transition Bar */}
              <div className="pt-4 border-t border-slate-200">
                <TicketStatusTransitionBar
                  ticket={selectedTicket}
                  onStatusUpdated={handleUpdated}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-24">
              Select a ticket from the triage queue on the left to inspect details.
            </div>
          )}
        </div>
      </div>

      <AuditHistoryDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        entries={mockAuditEntries}
      />
    </div>
  );
};
