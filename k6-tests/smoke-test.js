/**
 * Quick smoke test (~30s) — run before video recording.
 * Usage: k6 run k6-tests/smoke-test.js
 * Or: k6 run k6-tests/smoke-test.js -e BASE_URL=http://127.0.0.1:3000
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.3'],
  },
};

function login() {
  let res = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
  let body = res.json();
  if (body && body.token) return body.token;
  res = http.post(`${BASE_URL}/register`, JSON.stringify({
    name: 'Load Test User',
    email: 'loadtest@example.com',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
  if (res.status === 201 || res.status === 200) {
    res = http.post(`${BASE_URL}/login`, JSON.stringify({
      email: 'loadtest@example.com',
      password: 'password123',
    }), { headers: { 'Content-Type': 'application/json' } });
    body = res.json();
    return body && body.token ? body.token : null;
  }
  return null;
}

export default function () {
  const res = http.get(`${BASE_URL}/books?page=1&limit=20`);
  check(res, { 'GET /books 200': (r) => r.status === 200 });
  sleep(0.3);

  const token = login();
  if (token) {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const listRes = http.get(`${BASE_URL}/books?limit=5`, { headers });
    if (listRes.status === 200) {
      const books = listRes.json('books') || [];
      if (books.length > 0) {
        const borrowRes = http.post(`${BASE_URL}/borrow`, JSON.stringify({ bookId: books[0].id }), { headers });
        check(borrowRes, { 'POST /borrow 201 or 400': (r) => r.status === 201 || r.status === 400 });
      }
    }
    const myRes = http.get(`${BASE_URL}/my-books`, { headers });
    check(myRes, { 'GET /my-books 200': (r) => r.status === 200 });
  }
  sleep(0.5);
}
