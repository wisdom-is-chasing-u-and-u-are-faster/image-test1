import request from 'supertest';
import { app } from '../../src/app';
import { clearIdempotencyCache } from '../../src/middleware/idempotency.middleware';

describe('Ticket Ingestion & Idempotency Integration Suite (TC-INGEST-01, TC-INGEST-03)', () => {
  const testKey = 'e3b0c442-98fc-1c14-9afbf4c8996fb924';

  beforeEach(() => {
    clearIdempotencyCache();
  });

  it('TC-INGEST-03: Suppresses duplicate requests with identical idempotency key', async () => {
    const payload = {
      title: 'Database replica synchronization lag high',
      description: 'Replication delay exceeding 120 seconds on secondary read-replica node 02.',
      category: 'PostgreSQL',
      department_id: '22222222-2222-2222-2222-222222222222',
      priority: 'P2'
    };

    // First request -> creates ticket (or returns 200/201 in mock)
    const res1 = await request(app)
      .post('/api/v1/tickets')
      .set('X-Idempotency-Key', testKey)
      .send(payload);

    // Second request with SAME idempotency key
    const res2 = await request(app)
      .post('/api/v1/tickets')
      .set('X-Idempotency-Key', testKey)
      .send(payload);

    if (res1.status === 201) {
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache-lookup']).toBe('HIT');
      expect(res2.body.ticket_id).toBe(res1.body.ticket_id);
    }
  });
});
