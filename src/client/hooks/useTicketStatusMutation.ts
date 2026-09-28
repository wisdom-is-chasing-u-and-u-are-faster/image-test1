import { useState } from 'react';
import { Ticket, TicketStatus } from '../types/ticket';

export function useTicketStatusMutation(initialTicket: Ticket) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [error, setError] = useState<any | null>(null);

  const mutateStatus = async (targetStatus: TicketStatus, notes?: string) => {
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

      if (!res.ok) {
        const errPayload = await res.json();
        setError(errPayload);
        return false;
      }

      const updated = await res.json();
      setTicket(updated);
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  };

  return { ticket, mutateStatus, error };
}
