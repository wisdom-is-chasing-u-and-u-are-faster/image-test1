import React, { useState } from 'react';
import { RichTextEditor } from '../common/RichTextEditor';
import { FileUploadZone } from '../common/FileUploadZone';

export const TicketCreateForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('11111111-1111-1111-1111-111111111111');
  const [category, setCategory] = useState('Infrastructure');
  const [priority, setPriority] = useState<'P1'|'P2'|'P3'|'P4'>('P3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          title,
          description,
          department_id: departmentId,
          category,
          priority
        })
      });
      const data = await res.json();
      setCreatedTicket(data);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Submit Incident or Service Request</h2>

      {createdTicket && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
          ✅ Ticket successfully created: <strong>#{createdTicket.ticket_number}</strong> (Status: {createdTicket.status})
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Incident Summary / Title *</label>
        <input
          type="text"
          required
          minLength={5}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the outage or request..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Department *</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="11111111-1111-1111-1111-111111111111">Infrastructure & Cloud</option>
            <option value="22222222-2222-2222-2222-222222222222">Database Operations</option>
            <option value="33333333-3333-3333-3333-333333333333">Information Security</option>
            <option value="44444444-4444-4444-4444-444444444444">Network Operations</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Priority Tier *</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          >
            <option value="P1">P1 - Critical (2h SLA)</option>
            <option value="P2">P2 - High (4h SLA)</option>
            <option value="P3">P3 - Medium (24h SLA)</option>
            <option value="P4">P4 - Low (72h SLA)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. PostgreSQL, Kubernetes, IAM"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Detailed Description *</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnostic Artifacts</label>
        <FileUploadZone />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !title || !description}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Incident'}
        </button>
      </div>
    </form>
  );
};
