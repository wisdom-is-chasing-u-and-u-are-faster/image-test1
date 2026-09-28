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
