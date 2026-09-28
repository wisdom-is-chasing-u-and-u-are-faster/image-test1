import React, { useState, useEffect } from 'react';
import { QueueSplitView } from '../../components/agent/QueueSplitView';
import { Ticket } from '../../types/ticket';

export default function AgentInboxPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/tickets/search?limit=50');
      if (res.ok) {
        const data = await res.json();
        if (data.hits && data.hits.length > 0) {
          setTickets(data.hits);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setIsLoading(false);
    }

    // Default sample fallback if no tickets are in database yet
    setTickets([
      {
        ticket_id: 'default-1',
        ticket_number: 'TICK-908123',
        requester_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        department_id: 'dept-infrastructure',
        title: 'Production PostgreSQL connection pool saturated',
        description: 'Multiple microservices reporting timeout waiting for idle database connections.',
        status: 'ASSIGNED',
        priority: 'P1',
        category: 'PostgreSQL',
        sla_ack_status: 'MET',
        sla_resolve_status: 'RUNNING',
        version: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets(prev => prev.map(t => t.ticket_id === updated.ticket_id ? updated : t));
  };

  return (
    <div className="p-6">
      {isLoading && tickets.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading live triage queue...</div>
      ) : (
        <QueueSplitView
          tickets={tickets}
          onTicketUpdated={handleTicketUpdated}
          onRefresh={fetchTickets}
        />
      )}
    </div>
  );
}
