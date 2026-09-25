import React, { useState } from 'react';
import { QueueSplitView } from '../../components/agent/QueueSplitView';
import { Ticket } from '../../types/ticket';

export default function AgentInboxPage() {
  const [tickets] = useState<Ticket[]>([
    {
      ticket_id: '1',
      ticket_number: 'TICK-908123',
      requester_id: 'req-1',
      department_id: 'dept-1',
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

  return (
    <div className="h-screen bg-slate-100 p-6 flex flex-col">
      <QueueSplitView tickets={tickets} onSelectTicket={() => {}} />
    </div>
  );
}
