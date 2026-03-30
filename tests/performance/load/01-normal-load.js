import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const loginDuration = new Trend('login_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '30m', target: 500 },  // Stay at 500 users
    { duration: '5m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
    login_success: ['rate>0.99'],      // 99% login success
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';

export default function () {
  // Test 1: Login
  const loginPayload = JSON.stringify({
    email: 'admin@tradepro.com',
    password: 'admin123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);
  
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has email': (r) => JSON.parse(r.body).email !== undefined,
  });

  loginSuccessRate.add(loginRes.status === 200);
  loginDuration.add(loginRes.timings.duration);

  sleep(1);

  // Test 2: Get Dashboard Summary
  const cookies = loginRes.cookies;
  const dashboardParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    cookies: cookies,
  };

  const dashboardRes = http.get(`${BASE_URL}/api/dashboard/summary`, dashboardParams);
  
  check(dashboardRes, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard has portfolio_value': (r) => JSON.parse(r.body).portfolio_value !== undefined,
  });

  sleep(2);

  // Test 3: List Strategies
  const strategiesRes = http.get(`${BASE_URL}/api/strategies`, dashboardParams);
  
  check(strategiesRes, {
    'strategies status 200': (r) => r.status === 200,
    'strategies is array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(1);

  // Test 4: Get Market Quote
  const quoteRes = http.get(`${BASE_URL}/api/market/quote/AAPL`, dashboardParams);
  
  check(quoteRes, {
    'quote status 200': (r) => r.status === 200,
    'quote has price': (r) => JSON.parse(r.body).price !== undefined,
  });

  sleep(2);
}

// Setup function
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}