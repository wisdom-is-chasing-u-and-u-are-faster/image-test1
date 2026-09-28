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
