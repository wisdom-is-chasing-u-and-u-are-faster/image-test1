-- Digital Savings Account Opening Platform Schema (ANSI SQL / SQLite)

CREATE TABLE IF NOT EXISTS customer_application (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    ssn_masked TEXT NOT NULL,
    ssn_hash TEXT NOT NULL,
    id_document_uploaded INTEGER DEFAULT 1,
    liveness_verified INTEGER DEFAULT 1,
    verification_stage TEXT DEFAULT 'IDENTITY_VERIFIED',
    status TEXT DEFAULT 'APPROVED',
    cif_number TEXT,
    dda_number TEXT,
    language TEXT DEFAULT 'en',
    risk_score REAL DEFAULT 12.5,
    aml_flag INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_payload TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES customer_application(id)
);

CREATE TABLE IF NOT EXISTS compliance_decision (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    notes TEXT,
    reviewer_id TEXT,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES customer_application(id)
);

CREATE INDEX IF NOT EXISTS idx_customer_app_status ON customer_application(status);
CREATE INDEX IF NOT EXISTS idx_customer_app_email ON customer_application(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_app_id ON verification_audit_log(application_id);
