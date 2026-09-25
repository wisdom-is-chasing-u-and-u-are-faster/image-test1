import React from 'react';
import { Ticket } from '../../types/ticket';

interface SearchResultListProps {
  hits: Array<Ticket & { highlights?: any }>;
}

export const SearchResultList: React.FC<SearchResultListProps> = ({ hits }) => {
  if (hits.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No tickets found matching query.</div>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {hits.map(h => (
        <div key={h.ticket_id} className="p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-slate-500 font-semibold">#{h.ticket_number}</span>
            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[10px]">{h.status}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">{h.title}</h4>
          <p className="text-xs text-slate-600 line-clamp-2">{h.description}</p>
        </div>
      ))}
    </div>
  );
};
