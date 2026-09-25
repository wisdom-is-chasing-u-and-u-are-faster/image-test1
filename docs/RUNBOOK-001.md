# SRE Production Operations Runbook (RUNBOOK-001)

## 1. System Health Indicators
- Service: Cloud Run `etms-core-api`
- Ingestion SLA: P99 Latency <= 200ms
- Pub/Sub Backlog: `tickets.created-sub` unacked messages < 100
- OpenSearch Sync Lag: <= 1000ms

## 2. Incident Response Workflows
### Outbox / Pub/Sub Publishing Failures:
1. Verify dead-letter topic `tickets.created.dlq`.
2. Inspect outbox table in Cloud SQL for unacknowledged events.
3. Trigger replay worker: `npm run worker:replay-outbox`.

### High Rate of 409 Concurrency Conflicts:
1. Identify high-contention ticket UUIDs.
2. Confirm client UI has enabled WebSocket / SSE real-time state broadcast.
3. Verify optimistic locking retry backoff in client hooks.
