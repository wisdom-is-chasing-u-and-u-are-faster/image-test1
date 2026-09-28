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
