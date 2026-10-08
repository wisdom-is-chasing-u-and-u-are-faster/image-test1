-- Digital Savings Account Opening Platform Baseline Seed Data

INSERT OR IGNORE INTO customer_application (
    id, full_name, email, ssn_masked, ssn_hash, id_document_uploaded, liveness_verified,
    verification_stage, status, cif_number, dda_number, language, risk_score, aml_flag, created_at
) VALUES 
(
    'app-seed-001', 'Alex Rivera', 'alex.rivera@example.com', '******102',
    'hash_seed_001',
    1, 1, 'CBS_PROVISIONED', 'APPROVED', 'CIF-100293', 'DDA-994821', 'en', 8.5, 0, '2026-10-08 10:00:00'
),
(
    'app-seed-002', 'Maria Gonzales', 'maria.gonzales@example.es', '******849',
    'hash_seed_002',
    1, 1, 'AML_REVIEW_REQUIRED', 'IN_REVIEW', NULL, NULL, 'es', 74.0, 1, '2026-10-08 10:15:00'
),
(
    'app-seed-003', 'Johnathan Doe', 'j.doe@example.org', '******318',
    'hash_seed_003',
    1, 1, 'DOC_OCR_FAILED', 'REJECTED', NULL, NULL, 'en', 92.0, 0, '2026-10-08 09:30:00'
);

INSERT OR IGNORE INTO verification_audit_log (id, application_id, event_type, event_payload, status, created_at)
VALUES 
(1, 'app-seed-001', 'E_KYC_VERIFICATION', '{"match": true, "registry": "National_ID"}', 'SUCCESS', '2026-10-08 10:00:10'),
(2, 'app-seed-001', 'LIVENESS_CHECK', '{"confidence": 0.99, "passive_3d": true}', 'SUCCESS', '2026-10-08 10:00:25'),
(3, 'app-seed-001', 'CBS_CIF_PROVISIONING', '{"cif": "CIF-100293", "status": "CREATED"}', 'SUCCESS', '2026-10-08 10:00:45');
