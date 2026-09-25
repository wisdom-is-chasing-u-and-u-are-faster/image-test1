import React from 'react';
import { TicketCreateForm } from '../../components/tickets/TicketCreateForm';

export default function NewTicketPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <TicketCreateForm />
    </div>
  );
}
