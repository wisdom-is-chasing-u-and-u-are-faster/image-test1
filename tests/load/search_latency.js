// k6 OpenSearch P95 Latency Benchmark Script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'] // P95 latency must be <= 150ms
  }
};

export default function () {
  const res = http.get('http://localhost:8080/api/v1/tickets/search?q=database&priority=P1');
  check(res, {
    'status is 200': (r) => r.status === 200
  });
  sleep(0.1);
}
