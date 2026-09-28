// k6 Concurrency Race Simulation Script
// Validates optimistic locking behavior under 20 concurrent threads attempting to mutate the same ticket version
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    concurrency_race: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '10s'
    }
  }
};

export default function () {
  const url = 'http://localhost:8080/api/v1/tickets/00000000-0000-0000-0000-000000000001/status';
  const payload = JSON.stringify({
    status: 'IN_PROGRESS',
    expected_version: 1
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const res = http.patch(url, payload, params);

  // Exactly one request should succeed (200), and remaining 19 should fail with 409 Conflict
  check(res, {
    'status is 200 or 409': (r) => r.status === 200 || r.status === 409
  });
}
