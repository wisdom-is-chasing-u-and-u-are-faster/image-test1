import React from 'react';
import { Ticket } from '../../types/ticket';

interface TicketCardProps {
  ticket: Ticket;
  isSelected?: boolean;
  onSelect: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, isSelected, onSelect }) => {
  const priorityBadge = {
    P1: 'bg-red-100 text-red-800 border-red-200',
    P2: 'bg-orange-100 text-orange-800 border-orange-200',
    P3: 'bg-blue-100 text-blue-800 border-blue-200',
    P4: 'bg-slate-100 text-slate-800 border-slate-200'
  }[ticket.priority];

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold text-slate-600">#{ticket.ticket_number}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${priorityBadge}`}>
          {ticket.priority}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1">{ticket.title}</h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{ticket.description}</p>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-medium text-slate-600">{ticket.category}</span>
        <span>SLA: {ticket.sla_resolve_status}</span>
      </div>
    </div>
  );
};
