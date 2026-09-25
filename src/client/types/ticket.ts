export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus =
  | 'SUBMITTED'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export interface Ticket {
  ticket_id: string;
  ticket_number: string;
  requester_id: string;
  assigned_agent_id?: string | null;
  department_id: string;
  department_name?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  resolution_notes?: string | null;
  sla_ack_deadline?: string;
  sla_resolve_deadline?: string;
  sla_ack_status: 'RUNNING' | 'MET' | 'BREACHED';
  sla_resolve_status: 'RUNNING' | 'PAUSED' | 'MET' | 'BREACHED';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLedgerEntry {
  audit_id: string;
  ticket_id: string;
  actor_id?: string;
  actor_name?: string;
  action_type: string;
  old_state: any;
  new_state: any;
  diff_payload: Record<string, { old: any; new: any }>;
  checksum: string;
  timestamp: string;
}
