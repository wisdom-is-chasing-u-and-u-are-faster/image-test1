# Enterprise Ticketing Management System (ETMS)

[![Architecture](https://img.shields.io/badge/Architecture-Serverless%20Event--Driven-blue.svg)](#)
[![Epic](https://img.shields.io/badge/Jira%20Epic-ARCH--1603-success.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B%20with%20RLS-orange.svg)](#)
[![GCP](https://img.shields.io/badge/GCP-Cloud%20Run%20%7C%20PubSub%20%7C%20CloudTasks-red.svg)](#)

## 1. Overview
The **Enterprise Ticketing Management System (ETMS)** delivers a modern, resilient, serverless event-driven architecture designed to manage mission-critical enterprise incidents, outages, and internal service requests at scale. Built for Jira Epic **ARCH-1603**, ETMS provides:
- **Multi-Channel Ingestion REST API** (`POST /api/v1/tickets`) with exact-once semantics via `X-Idempotency-Key`.
- **7-State Lifecycle Finite State Machine** with optimistic concurrency locking (`expected_version`).
- **Skill-Based Automated Ticket Routing** matching tickets to least-loaded specialists in < 500ms.
- **Asynchronous SLA Monitoring** with Google Cloud Tasks callbacks at 50%, 75%, and 100% threshold milestones.
- **Near Real-Time OpenSearch Synchronization** with full-text search, term facets, and sub-150ms P95 query response.
- **PostgreSQL 15+ Row-Level Security (RLS)** with immutable cryptographic audit ledger and SHA-256 triggers.
- **Responsive Agent Workbench & Live Triage Dashboard** conforming to WCAG 2.1 AA accessibility.

## 2. Architecture Baseline (Option B: Serverless Event-Driven)
```text
Requester / Monitoring
       │
       ▼ (HTTPS / TLS 1.3)
Cloud API Gateway / Cloud Run (Ingestion REST API)
       │
       ├─────────────────────────────────┬───────────────────────────────┐
       ▼                                 ▼                               ▼
Cloud SQL PostgreSQL 15+          Cloud Pub/Sub Topics             Google Cloud Tasks
- RLS Policy Isolation            - tickets.created                - 50% SLA Warning Task
- Tamper-proof Audit Ledger       - tickets.status_changed         - 75% SLA Escalation Task
- SHA-256 Checksum Triggers       - tickets.assigned               - 100% SLA Breach Task
                                         │                               │
                                         ▼                               ▼
                                Routing & Search Indexer          SLA Escalation Callback
                                - Agent Matching Algorithm        - Omnichannel Alerts
                                - OpenSearch Near-RT Sync         - Slack / Teams / Email
```

## 3. Directory Structure
```
├── config/
│   └── opensearch_mapping.json         # OpenSearch analyzers, tokenizers, and schema mapping
├── docs/
│   ├── ADR-001.md                      # Architecture Decision Record
│   ├── API-SPEC-001.yaml               # OpenAPI 3.0.3 Contract Specification
│   ├── DB-CHANGELOG-001.sql            # PostgreSQL 15+ DDL, RLS, triggers & seed scripts
│   ├── DESIGN-PAGES-001.md             # UI/UX Specifications
│   ├── RUNBOOK-001.md                  # SRE Operations Runbook
│   ├── SEC-ASSESSMENT-001.md           # STRIDE Threat Modeling & Mitigation
│   ├── SEQ-DIAGRAM-001.mmd             # Mermaid Sequence Workflows
└── docs/TEST-PLAN-001.md                # QA Test Plan & 18 Gherkin Scenarios
├── src/
│   ├── api/
│   │   ├── controllers/                # REST Controllers (ticket, status, search, sla_callback)
│   │   └── validators/                 # Zod validation schemas
│   ├── client/                         # React UI Pages, Components & Custom Hooks
│   ├── clients/                        # OpenSearch client wrapper
│   ├── config/                         # Environment & runtime configurations
│   ├── db/
│   │   ├── migrations/                 # Baseline DDL, performance indexes, triggers, RLS
│   │   ├── seeds/                      # Initial departments, users, and skills taxonomy
│   │   └── triggers/                   # fn_ticket_audit_trigger and fn_protect_audit_ledger
│   ├── domain/state_machine/           # 7-State FSM engine & optimistic locking
│   ├── errors/                         # RFC-7807 problem details and 409 conflict errors
│   ├── middleware/                     # Idempotency & DB session context middleware
│   ├── repositories/                   # Workload & agent repository
│   ├── security/                       # JWT claim extractor
│   ├── services/                       # Ticket intake, lifecycle, routing, SLA, search, alerts
│   ├── templates/                      # Responsive HTML email alert templates
│   └── workers/                        # Routing consumer, OpenSearch indexer, notification worker
└── tests/
    ├── contract/                       # OpenAPI 3.0.3 contract conformance tests
    ├── integration/                    # Ingestion, state machine, SLA, search, routing tests
    ├── load/                           # k6 concurrency race and latency benchmark scripts
    └── security/                       # STRIDE & audit ledger immutability tests
```

## 4. Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Run database migrations
npm run migrate:up

# 3. Start development server
npm run dev

# 4. Run test suites
npm test
npm run test:integration
npm run test:security
```
