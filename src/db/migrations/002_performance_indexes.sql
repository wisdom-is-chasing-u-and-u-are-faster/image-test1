-- Migration: 002_performance_indexes.sql
-- Description: Composite and partial indexes for high concurrency & triage queue response

CREATE INDEX IF NOT EXISTS idx_tickets_dept_status ON tickets(department_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_status ON tickets(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority_created ON tickets(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_resolve ON tickets(sla_resolve_deadline) WHERE status NOT IN ('RESOLVED', 'CLOSED');
CREATE INDEX IF NOT EXISTS idx_comments_ticket_created ON ticket_comments(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_audit_ticket_timestamp ON ticket_audit_ledger(ticket_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_diff_gin ON ticket_audit_ledger USING GIN(diff_payload);
