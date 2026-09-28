# Verification Test Plan (TEST-PLAN-001)

## 1. Scope & Strategy
This test plan provides comprehensive verification across the ETMS platform, testing all 18 Gherkin scenarios defined in the master BRD and Jira Epic ARCH-1603.

## 2. Test Suites
- **Suite 1: Ingestion & Idempotency** (TC-INGEST-01 to TC-INGEST-03)
- **Suite 2: 7-State Lifecycle State Machine & Concurrency** (TC-STATE-01, TC-CONCUR-01)
- **Suite 3: SLA Milestone Monitoring & Escalation Callbacks** (TC-SLA-01 to TC-SLA-04)
- **Suite 4: Enterprise Security, RLS & Cryptographic Immutability** (TC-SEC-01 to TC-SEC-03)
- **Suite 5: Skill-Based Routing & Agent Workload Distribution** (TC-ROUTE-01, TC-ROUTE-02)
- **Suite 6: Faceted Search & Latency Benchmarks** (TC-SEARCH-01, TC-SEARCH-02)

## 3. Gherkin Scenarios
### Scenario 1 (Positive Intake):
- **Given** a valid authenticated payload with required fields.
- **When** POST /api/v1/tickets is called with unique `X-Idempotency-Key`.
- **Then** return HTTP 201 Created within 200ms and set status to 'SUBMITTED'.

### Scenario 2 (Idempotent Resubmission):
- **Given** an existing ticket created with key `K`.
- **When** identical POST is received with key `K`.
- **Then** return HTTP 200 OK with cached ticket body without duplicate DB rows.

### Scenario 3 (Optimistic Concurrency Conflict):
- **Given** a ticket currently at version 3.
- **When** PATCH /api/v1/tickets/{id}/status is invoked with `expected_version=2`.
- **Then** return HTTP 409 Conflict with `current_version=3` and reject mutation.
