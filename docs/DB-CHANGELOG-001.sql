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


-- Migration: 002_performance_indexes.sql
-- Description: Composite and partial indexes for high concurrency & triage queue response

CREATE INDEX IF NOT EXISTS idx_tickets_dept_status ON tickets(department_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_status ON tickets(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority_created ON tickets(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_resolve ON tickets(sla_resolve_deadline) WHERE status NOT IN ('RESOLVED', 'CLOSED');
CREATE INDEX IF NOT EXISTS idx_comments_ticket_created ON ticket_comments(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_audit_ticket_timestamp ON ticket_audit_ledger(ticket_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_diff_gin ON ticket_audit_ledger USING GIN(diff_payload);


-- Trigger Function: fn_ticket_audit_trigger
-- Description: Calculates JSONB delta, fetches session actor, computes SHA-256 digest, and inserts immutable ledger entry

CREATE OR REPLACE FUNCTION fn_ticket_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_old_json JSONB;
    v_new_json JSONB;
    v_diff JSONB;
    v_checksum VARCHAR(64);
    v_key TEXT;
    v_val JSONB;
BEGIN
    BEGIN
        v_actor_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_new_json := to_jsonb(NEW);
        v_checksum := encode(digest(v_new_json::text || clock_timestamp()::text, 'sha256'), 'hex');
        INSERT INTO ticket_audit_ledger (
            ticket_id, actor_id, action_type, old_state, new_state, diff_payload, checksum, timestamp
        ) VALUES (
            NEW.ticket_id, COALESCE(v_actor_id, NEW.requester_id), 'CREATE', NULL, v_new_json, v_new_json, v_checksum, clock_timestamp()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        v_diff := '{}'::JSONB;

        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_new_json)
        LOOP
            IF v_old_json -> v_key IS DISTINCT FROM v_val THEN
                v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_object('old', v_old_json -> v_key, 'new', v_val));
            END IF;
        END LOOP;

        v_checksum := encode(digest(v_diff::text || clock_timestamp()::text, 'sha256'), 'hex');

        INSERT INTO ticket_audit_ledger (
            ticket_id, actor_id, action_type, old_state, new_state, diff_payload, checksum, timestamp
        ) VALUES (
            NEW.ticket_id, v_actor_id, 'STATUS_UPDATE', v_old_json, v_new_json, v_diff, v_checksum, clock_timestamp()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger Function: fn_protect_audit_ledger
-- Description: Prevents any UPDATE or DELETE mutation on ticket_audit_ledger, guaranteeing 100% append-only immutability

CREATE OR REPLACE FUNCTION fn_protect_audit_ledger()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit ledger is strictly immutable. % operation prohibited.', TG_OP
        USING ERRCODE = '23506',
              HINT = 'Direct modification or removal of audit logs violates enterprise compliance policies.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- Migration: 003_audit_triggers.sql
-- Description: Hooks fn_ticket_audit_trigger onto tickets and fn_protect_audit_ledger onto ticket_audit_ledger

DROP TRIGGER IF EXISTS trg_ticket_audit_insert_update ON tickets;
CREATE TRIGGER trg_ticket_audit_insert_update
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_ticket_audit_trigger();

DROP TRIGGER IF EXISTS trg_protect_audit_ledger ON ticket_audit_ledger;
CREATE TRIGGER trg_protect_audit_ledger
BEFORE UPDATE OR DELETE ON ticket_audit_ledger
FOR EACH ROW EXECUTE FUNCTION fn_protect_audit_ledger();


-- Migration: 004_skills_and_capacities.sql
-- Description: Skills taxonomy, user skill matrix, and agent capacity limits for intelligent routing

CREATE TABLE IF NOT EXISTS skills (
    skill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_code VARCHAR(32) UNIQUE NOT NULL,
    skill_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS agent_capacity (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    max_concurrent_p1_p2 INT NOT NULL DEFAULT 5,
    max_total_active INT NOT NULL DEFAULT 15,
    is_accepting_tickets BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id, user_id);


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


-- Migration: 006_rls_security_policies.sql
-- Description: Enterprise PostgreSQL Row-Level Security (RLS) for departmental isolation & comment privacy

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_ticket_access_isolation ON tickets;
CREATE POLICY p_ticket_access_isolation ON tickets
    FOR ALL
    USING (
        current_setting('app.user_role', true) = 'SUPER_ADMIN'
        OR current_setting('app.user_role', true) = 'AUDITOR'
        OR requester_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
        OR assigned_agent_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
        OR department_id = NULLIF(current_setting('app.current_department_id', true), '')::UUID
    );

DROP POLICY IF EXISTS p_comment_read_visibility ON ticket_comments;
CREATE POLICY p_comment_read_visibility ON ticket_comments
    FOR SELECT
    USING (
        current_setting('app.user_role', true) IN ('SUPER_ADMIN', 'AUDITOR', 'OPS_MANAGER', 'AGENT', 'TIER2_SPECIALIST')
        OR (is_internal = FALSE)
    );

DROP POLICY IF EXISTS p_comment_write_access ON ticket_comments;
CREATE POLICY p_comment_write_access ON ticket_comments
    FOR INSERT
    WITH CHECK (
        author_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
    );


-- Seed: initial_departments_users.sql
-- Description: Standard enterprise departments and benchmark user accounts

INSERT INTO departments (department_id, department_code, department_name) VALUES
('11111111-1111-1111-1111-111111111111', 'IT-INFRA', 'Infrastructure & Cloud Operations'),
('22222222-2222-2222-2222-222222222222', 'DB-OPS', 'Database Operations'),
('33333333-3333-3333-3333-333333333333', 'SEC-OPS', 'Information Security & Compliance'),
('44444444-4444-4444-4444-444444444444', 'NET-OPS', 'Network Operations')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO users (user_id, email, first_name, last_name, role, department_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice.req@corp.internal', 'Alice', 'Requester', 'REQUESTER', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob.dba@corp.internal', 'Bob', 'DBA Specialist', 'TIER2_SPECIALIST', '22222222-2222-2222-2222-222222222222'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'carol.agent@corp.internal', 'Carol', 'Support Agent', 'AGENT', '11111111-1111-1111-1111-111111111111'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dan.manager@corp.internal', 'Dan', 'Ops Manager', 'OPS_MANAGER', '11111111-1111-1111-1111-111111111111'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eve.auditor@corp.internal', 'Eve', 'Security Auditor', 'AUDITOR', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (user_id) DO NOTHING;


-- Seed: skills_taxonomy.sql
-- Description: Standard ITSM skills and agent associations

INSERT INTO skills (skill_id, skill_code, skill_name, category) VALUES
('99999999-9999-9999-9999-999999999991', 'SKILL_PGSQL', 'PostgreSQL Administration', 'PostgreSQL'),
('99999999-9999-9999-9999-999999999992', 'SKILL_K8S', 'Kubernetes & Container Platforms', 'Infrastructure'),
('99999999-9999-9999-9999-999999999993', 'SKILL_NET', 'Enterprise Network & Firewall', 'Networking'),
('99999999-9999-9999-9999-999999999994', 'SKILL_SEC', 'IAM & Vulnerability Remediation', 'Security')
ON CONFLICT (skill_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999991', 5),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999992', 4)
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO agent_capacity (user_id, max_concurrent_p1_p2, max_total_active, is_accepting_tickets) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 15, TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 15, TRUE)
ON CONFLICT (user_id) DO NOTHING;
