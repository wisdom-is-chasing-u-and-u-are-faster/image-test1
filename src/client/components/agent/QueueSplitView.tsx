import React, { useState, useEffect } from 'react';
import { Ticket } from '../../types/ticket';
import { TicketCard } from './TicketCard';
import { LiveKpiRibbon } from './LiveKpiRibbon';

interface QueueSplitViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const QueueSplitView: React.FC<QueueSplitViewProps> = ({ tickets, onSelectTicket }) => {
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.ticket_id || null);

  const selectedTicket = tickets.find(t => t.ticket_id === selectedId) || tickets[0];

  useEffect(() => {
    if (selectedTicket) {
      onSelectTicket(selectedTicket);
    }
  }, [selectedId]);

  return (
    <div className="h-full flex flex-col">
      <LiveKpiRibbon
        assignedToMe={tickets.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length}
        unassigned={tickets.filter(t => t.status === 'QUEUED' || t.status === 'SUBMITTED').length}
        slaWarning={tickets.filter(t => t.sla_resolve_status === 'RUNNING').length}
        breached={tickets.filter(t => t.sla_resolve_status === 'BREACHED').length}
      />
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-5 border border-slate-200 bg-slate-50/50 rounded-xl p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Triage Queue ({tickets.length})</h3>
            <span className="text-xs text-slate-500">Shortcuts: J/K navigate, A assign</span>
          </div>
          {tickets.map(t => (
            <TicketCard
              key={t.ticket_id}
              ticket={t}
              isSelected={t.ticket_id === selectedId}
              onSelect={() => setSelectedId(t.ticket_id)}
            />
          ))}
        </div>
        <div className="col-span-7 border border-slate-200 bg-white rounded-xl p-6 overflow-y-auto">
          {selectedTicket ? (
            <div>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div>
                  <span className="text-xs font-mono text-slate-500">#{selectedTicket.ticket_number}</span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedTicket.title}</h2>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">
                  {selectedTicket.status}
                </span>
              </div>
              <div className="prose prose-sm text-slate-700 mb-6">
                <p>{selectedTicket.description}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">Select a ticket to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};
