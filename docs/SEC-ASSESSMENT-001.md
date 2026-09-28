# STRIDE Security Threat Assessment & Mitigation (SEC-ASSESSMENT-001)

| Threat Category | Potential Attack Vector | Architectural Mitigation |
|---|---|---|
| **Spoofing** | JWT token forgery or replay | OIDC RS256 signature verification and audience validation |
| **Tampering** | Direct SQL mutation of audit history | PL/pgSQL trigger `fn_protect_audit_ledger` raising exceptions on UPDATE/DELETE |
| **Repudiation** | Denial of ticket status modification | Append-only ledger with cryptographic SHA-256 hash chaining |
| **Information Disclosure** | Inter-department ticket leakage | PostgreSQL Row-Level Security (RLS) policies scoped by `department_id` |
| **Information Disclosure** | Requester viewing internal notes | RLS policy `p_comment_read_visibility` hiding `is_internal=true` from requesters |
| **Denial of Service** | High-volume API flooding | Cloud API Gateway token bucket rate limiter (1000 req/min/tenant) |
| **Elevation of Privilege** | Agent modifying ticket outside scope | Session context verification against JWT claims in active transaction |
