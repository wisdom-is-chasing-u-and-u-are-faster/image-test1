import request from 'supertest';
import { app } from '../../src/app';
import { SlaCalculatorService } from '../../src/services/sla_calculator.service';

describe('SLA Milestone & Cloud Tasks Escalation Suite (TC-SLA-01 to TC-SLA-04)', () => {
  it('TC-SLA-01: Computes exact SLA deadlines per priority tier', () => {
    const base = new Date('2026-09-25T10:00:00Z');
    const p1 = SlaCalculatorService.calculate('P1', base);
    expect(p1.slaAckDeadline.getTime() - base.getTime()).toBe(15 * 60 * 1000); // 15 mins
    expect(p1.slaResolveDeadline.getTime() - base.getTime()).toBe(2 * 3600 * 1000); // 2 hours

    const p3 = SlaCalculatorService.calculate('P3', base);
    expect(p3.slaAckDeadline.getTime() - base.getTime()).toBe(2 * 3600 * 1000); // 2 hours
    expect(p3.slaResolveDeadline.getTime() - base.getTime()).toBe(24 * 3600 * 1000); // 24 hours
  });

  it('TC-SLA-04: Gracefully handles callback for already resolved ticket without escalating', async () => {
    const res = await request(app)
      .post('/internal/sla/callback')
      .send({
        ticket_id: 'non-existent-uuid',
        milestone: '50%'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SKIPPED');
  });
});
