-- Migration: 001_baseline_schema.sql
-- Description: Core baseline schema for ETMS (departments, users, tickets, comments, audit ledger)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(32) UNIQUE NOT NULL,
    department_name VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('REQUESTER', 'AGENT', 'TIER2_SPECIALIST', 'OPS_MANAGER', 'AUDITOR', 'SUPER_ADMIN')),
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(32) UNIQUE NOT NULL,
    requester_id UUID NOT NULL REFERENCES users(user_id),
    assigned_agent_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (
        status IN ('SUBMITTED', 'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED')
    ),
    priority VARCHAR(16) NOT NULL DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    category VARCHAR(64) NOT NULL,
    resolution_notes TEXT,
    sla_ack_deadline TIMESTAMPTZ,
    sla_resolve_deadline TIMESTAMPTZ,
    sla_ack_status VARCHAR(16) DEFAULT 'RUNNING' CHECK (sla_ack_status IN ('RUNNING', 'MET', 'BREACHED')),
    sla_resolve_status VARCHAR(16) DEFAULT 'RUNNING' CHECK (sla_resolve_status IN ('RUNNING', 'PAUSED', 'MET', 'BREACHED')),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(user_id),
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_audit_ledger (
    audit_id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL,
    actor_id UUID,
    action_type VARCHAR(64) NOT NULL,
    old_state JSONB,
    new_state JSONB,
    diff_payload JSONB NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
