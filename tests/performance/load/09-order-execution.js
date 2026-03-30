import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const orderSuccessRate = new Rate('order_success');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    order_success: ['rate>0.98'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';

export default function () {
  // Login first
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'admin@tradepro.com',
      password: 'admin123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    return;
  }

  const cookies = loginRes.cookies;

  // Get brokers
  const brokersRes = http.get(`${BASE_URL}/api/brokers`, {
    cookies: cookies,
  });

  if (brokersRes.status !== 200 || JSON.parse(brokersRes.body).length === 0) {
    console.log('No brokers connected, skipping order test');
    return;
  }

  const brokers = JSON.parse(brokersRes.body);
  const brokerId = brokers[0].id;

  // Place order
  const orderPayload = JSON.stringify({
    broker_id: brokerId,
    symbol: 'AAPL',
    side: 'buy',
    quantity: 10,
    order_type: 'market',
  });

  const orderRes = http.post(
    `${BASE_URL}/api/orders`,
    orderPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      cookies: cookies,
    }
  );

  check(orderRes, {
    'order placed': (r) => r.status === 200,
    'order has id': (r) => JSON.parse(r.body).id !== undefined,
  });

  orderSuccessRate.add(orderRes.status === 200);

  sleep(1);
}