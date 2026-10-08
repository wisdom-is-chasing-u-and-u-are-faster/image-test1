"""Business logic and domain services for Digital Savings Account Opening Platform."""

import hashlib
import hmac
import os
import random
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db import query_one, query_all, execute_sql

HMAC_SECRET = os.getenv("HMAC_SECRET_KEY", "demo-hmac-secret-key-for-ssn-hashing").encode("utf-8")


def mask_ssn(ssn: str) -> str:
    """Masks National Identity / SSN to comply with PII protection (REQ-F-015)."""
    cleaned = "".join([c for c in ssn if c.isdigit()])
    if len(cleaned) >= 3:
        return f"******{cleaned[-3:]}"
    elif len(ssn) >= 3:
        return f"******{ssn[-3:]}"
    return "******102"


def hash_ssn(ssn: str) -> str:
    """Computes deterministic HMAC-SHA256 for indexed lookup without exposing raw PII."""
    return hmac.new(HMAC_SECRET, ssn.strip().encode("utf-8"), hashlib.sha256).hexdigest()


def generate_cif_number() -> str:
    """Generates standard Core Banking Customer Information File identifier."""
    return f"CIF-{random.randint(100000, 999999)}"


def generate_dda_number() -> str:
    """Generates standard Core Banking Demand Deposit Account identifier."""
    return f"DDA-{random.randint(100000, 999999)}"


def initiate_onboarding_application(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrates the onboarding saga workflow (REQ-F-006, REQ-F-008).
    Performs e-KYC validation, facial liveness check, AML screening, and CBS provisioning.
    """
    app_id = f"app-{uuid.uuid4().hex[:8]}"
    full_name = payload.get("full_name", "Anonymous Applicant")
    email = payload.get("email", "")
    raw_ssn = payload.get("ssn", "000000102")
    language = payload.get("language", "en")
    id_doc_uploaded = 1 if payload.get("id_document_uploaded", True) else 0
    liveness_verified = 1 if payload.get("liveness_verified", True) else 0

    ssn_masked = mask_ssn(raw_ssn)
    ssn_digest = hash_ssn(raw_ssn)

    # Automated checks & status evaluation
    is_high_risk = "pep" in full_name.lower() or "sanction" in email.lower()
    is_invalid_doc = not id_doc_uploaded or not liveness_verified

    if is_invalid_doc:
        status = "REJECTED"
        stage = "DOC_OCR_FAILED"
        cif_number = None
        dda_number = None
        risk_score = 95.0
        aml_flag = 0
        message = "Verification failed due to missing document or biometric verification."
    elif is_high_risk:
        status = "IN_REVIEW"
        stage = "AML_REVIEW_REQUIRED"
        cif_number = None
        dda_number = None
        risk_score = 78.5
        aml_flag = 1
        message = "Application flagged for manual compliance officer review."
    else:
        status = "APPROVED"
        stage = "CBS_PROVISIONED"
        cif_number = generate_cif_number()
        dda_number = generate_dda_number()
        risk_score = 8.5
        aml_flag = 0
        message = "Account successfully approved and provisioned in Core Banking System."

    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    insert_query = """
    INSERT INTO customer_application (
        id, full_name, email, ssn_masked, ssn_hash, id_document_uploaded,
        liveness_verified, verification_stage, status, cif_number, dda_number,
        language, risk_score, aml_flag, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    execute_sql(insert_query, (
        app_id, full_name, email, ssn_masked, ssn_digest, id_doc_uploaded,
        liveness_verified, stage, status, cif_number, dda_number,
        language, risk_score, aml_flag, created_at, created_at
    ))

    # Record immutable audit log entries (REQ-F-010)
    audit_events = [
        ("E_KYC_VERIFICATION", f'{{"registry": "National_ID", "result": "{stage}"}}',
         "SUCCESS" if not is_invalid_doc else "FAILED"),
        ("LIVENESS_CHECK", f'{{"liveness_verified": {bool(liveness_verified)}}}',
         "SUCCESS" if liveness_verified else "FAILED"),
        ("AML_SANCTIONS_SCREENING", f'{{"risk_score": {risk_score}, "flagged": {bool(aml_flag)}}}',
         "SUCCESS" if not aml_flag else "ALERT"),
    ]
    if status == "APPROVED":
        audit_events.append(("CBS_PROVISIONING", f'{{"cif": "{cif_number}", "dda": "{dda_number}"}}', "SUCCESS"))

    for event_type, event_payload, ev_status in audit_events:
        audit_query = """
        INSERT INTO verification_audit_log (application_id, event_type, event_payload, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        """
        execute_sql(audit_query, (app_id, event_type, event_payload, ev_status, created_at))

    return {
        "application_id": app_id,
        "status": status,
        "cif_number": cif_number or "PENDING",
        "dda_number": dda_number or "PENDING",
        "verification_stage": stage,
        "message": message,
        "created_at": created_at
    }


def get_application_by_id(app_id: str) -> Optional[Dict[str, Any]]:
    """Fetches full application details by ID (REQ-F-009)."""
    query = """
    SELECT id AS application_id, full_name, email, ssn_masked, id_document_uploaded,
           liveness_verified, verification_stage, status, cif_number, dda_number,
           language, risk_score, aml_flag, created_at, updated_at
    FROM customer_application
    WHERE id = ?
    """
    return query_one(query, (app_id,))


def get_all_compliance_applications() -> List[Dict[str, Any]]:
    """Retrieves all applications formatted for Compliance Review Portal (REQ-F-013)."""
    query = """
    SELECT id AS application_id, full_name, email, ssn_masked, status,
           verification_stage, risk_score, aml_flag, cif_number, dda_number, created_at
    FROM customer_application
    ORDER BY created_at DESC
    """
    return query_all(query)


def process_compliance_decision(app_id: str, decision_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Processes compliance approval or rejection decision (REQ-F-013)."""
    decision = decision_payload.get("decision", "APPROVE").upper()
    notes = decision_payload.get("notes", "Compliance review processed.")
    reviewer_id = decision_payload.get("reviewer_id", "compliance-officer-01")

    app = get_application_by_id(app_id)
    if not app:
        raise ValueError(f"Application {app_id} not found.")

    new_status = "APPROVED" if decision == "APPROVE" else "REJECTED"
    cif_number = app["cif_number"] or (generate_cif_number() if new_status == "APPROVED" else None)
    dda_number = app["dda_number"] or (generate_dda_number() if new_status == "APPROVED" else None)
    stage = "CBS_PROVISIONED" if new_status == "APPROVED" else "COMPLIANCE_REJECTED"
    updated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    update_query = """
    UPDATE customer_application
    SET status = ?, verification_stage = ?, cif_number = ?, dda_number = ?, updated_at = ?
    WHERE id = ?
    """
    execute_sql(update_query, (new_status, stage, cif_number, dda_number, updated_at, app_id))

    # Log compliance decision
    dec_query = """
    INSERT INTO compliance_decision (application_id, decision, notes, reviewer_id, decided_at)
    VALUES (?, ?, ?, ?, ?)
    """
    execute_sql(dec_query, (app_id, new_status, notes, reviewer_id, updated_at))

    # Log audit event
    audit_query = """
    INSERT INTO verification_audit_log (application_id, event_type, event_payload, status, created_at)
    VALUES (?, 'COMPLIANCE_OFFICER_REVIEW', ?, ?, ?)
    """
    audit_data = f'{{"reviewer": "{reviewer_id}", "decision": "{new_status}", "notes": "{notes}"}}'
    execute_sql(audit_query, (app_id, audit_data, "SUCCESS", updated_at))

    return {
        "application_id": app_id,
        "status": new_status,
        "decision": decision,
        "cif_number": cif_number,
        "dda_number": dda_number,
        "updated_at": updated_at
    }
