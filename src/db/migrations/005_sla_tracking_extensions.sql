-- Migration: 005_sla_tracking_extensions.sql
-- Description: SLA pause intervals for PENDING_CUSTOMER status tracking and compliance reporting

CREATE TABLE IF NOT EXISTS sla_pause_intervals (
    interval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    paused_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resumed_at TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sla_pause_ticket ON sla_pause_intervals(ticket_id, paused_at);
