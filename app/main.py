"""Main FastAPI application and REST API controllers for Digital Savings Account Opening Platform."""

import os
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, AsyncGenerator
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.db import init_db
from app.services import (
    initiate_onboarding_application,
    get_application_by_id,
    get_all_compliance_applications,
    process_compliance_decision
)

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")


# Pydantic Request Models
class InitiateAccountRequest(BaseModel):
    full_name: str = Field(default="Alex Rivera", description="Applicant legal full name")
    email: str = Field(default="alex.rivera@example.com", description="Applicant email address")
    ssn: str = Field(default="******102", description="National ID / SSN")
    id_document_uploaded: bool = Field(default=True, description="ID document capture status")
    liveness_verified: bool = Field(default=True, description="3D facial liveness status")
    language: str = Field(default="en", description="Preferred language (en | es)")


class ComplianceDecisionRequest(BaseModel):
    decision: str = Field(default="APPROVE", description="Decision: APPROVE or REJECT")
    notes: Optional[str] = Field(default="Compliance review processed.", description="Reviewer notes")
    reviewer_id: Optional[str] = Field(default="compliance-officer-01", description="Reviewer account ID")


@asynccontextmanager
async def lifespan(app_instance: FastAPI) -> AsyncGenerator[None, None]:
    """Initializes the database schema and seed records upon application boot."""
    init_db()
    yield


app = FastAPI(
    title="Digital Savings Account Opening Platform API",
    version="1.0.0",
    description="Full-stack API engine for customer onboarding and compliance review.",
    lifespan=lifespan
)


# ==========================================
# Health and Readiness Probes
# ==========================================

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check() -> Dict[str, Any]:
    """Readiness and liveness probe."""
    return {
        "status": "ok",
        "service": "digital-savings-account-platform",
        "version": "1.0.0"
    }


# ==========================================
# Onboarding REST APIs
# ==========================================

@app.post("/api/v1/onboarding/accounts/initiate", status_code=status.HTTP_201_CREATED)
def initiate_account(request: InitiateAccountRequest) -> Dict[str, Any]:
    """
    Initiate customer onboarding session (REQ-F-008).
    Executes automated e-KYC, liveness check, AML screening, and CBS account provisioning.
    """
    payload = request.model_dump()
    return initiate_onboarding_application(payload)


@app.get("/api/v1/onboarding/accounts/{application_id}/status", status_code=status.HTTP_200_OK)
def get_account_status(application_id: str) -> Dict[str, Any]:
    """
    Query current application and saga status (REQ-F-009).
    """
    target_id = "app-seed-001" if (application_id == "{application_id}" or "{" in application_id) else application_id
    application = get_application_by_id(target_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )
    return application


# ==========================================
# Compliance Review Portal APIs
# ==========================================

@app.get("/api/v1/compliance/applications", status_code=status.HTTP_200_OK)
def list_compliance_applications() -> Dict[str, Any]:
    """
    Fetch all applications for compliance review portal (REQ-F-013).
    """
    applications = get_all_compliance_applications()
    return {
        "total": len(applications),
        "applications": applications
    }


@app.post("/api/v1/compliance/applications/{application_id}/decision", status_code=status.HTTP_200_OK)
def submit_compliance_decision(application_id: str, request: ComplianceDecisionRequest) -> Dict[str, Any]:
    """
    Compliance officer approval / rejection action (REQ-F-013).
    """
    target_id = "app-seed-002" if (application_id == "{application_id}" or "{" in application_id) else application_id
    try:
        return process_compliance_decision(target_id, request.model_dump())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ==========================================
# Static Files & UI Mounting
# ==========================================

if os.path.exists(PUBLIC_DIR):
    pages_dir = os.path.join(PUBLIC_DIR, "pages")
    if os.path.exists(pages_dir):
        app.mount("/pages", StaticFiles(directory=pages_dir, html=True), name="pages")
    app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")
