import request from 'supertest';
import { app } from '../../src/app';
import { clearIdempotencyCache } from '../../src/middleware/idempotency.middleware';

describe('OpenAPI 3.0.3 Contract & RFC-7807 Verification Suite (TC-INGEST-01, TC-INGEST-02)', () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  it('TC-INGEST-01: Rejects requests missing X-Idempotency-Key with RFC-7807 problem details', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({
        title: 'Network Gateway Down',
        description: 'Primary router flapping in datacentre rack 4.',
        category: 'Networking',
        department_id: '44444444-4444-4444-4444-444444444444',
        priority: 'P1'
      });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('title', 'Bad Request');
    expect(res.body.detail).toContain('X-Idempotency-Key');
  });

  it('TC-INGEST-02: Returns 400 Problem Details on schema validation error', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('X-Idempotency-Key', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      .send({
        title: 'bad', // too short (< 5)
        description: 'short',
        category: '',
        department_id: 'not-a-uuid'
      });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(res.body.title).toBe('Validation Error');
  });
});
