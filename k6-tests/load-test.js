import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    browse_books: {
      executor: 'constant-vus',
      exec: 'browseBooks',
      vus: 30,
      duration: '2m',
    },
    borrow_flow: {
      executor: 'constant-vus',
      exec: 'borrowFlow',
      vus: 20,
      duration: '2m',
      startTime: '30s',
    },
    spike: {
      executor: 'ramping-vus',
      exec: 'browseBooks',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '3m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1'],
  },
};

let authToken = null;

function login() {
  const res = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
  if (res.json('token')) return res.json('token');
  const reg = http.post(`${BASE_URL}/register`, JSON.stringify({
    name: 'Load Test User',
    email: 'loadtest@example.com',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
  if (reg.status === 201 || reg.status === 200) {
    const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
      email: 'loadtest@example.com',
      password: 'password123',
    }), { headers: { 'Content-Type': 'application/json' } });
    return loginRes.json('token');
  }
  return null;
}

export function setup() {
  authToken = login();
  return { token: authToken };
}

export function browseBooks() {
  const page = Math.floor(Math.random() * 5) + 1;
  const search = Math.random() > 0.7 ? 'code' : '';
  const url = `${BASE_URL}/books?page=${page}&limit=20${search ? `&search=${search}` : ''}`;
  const res = http.get(url);
  check(res, { 'books status 200': (r) => r.status === 200 });
  sleep(0.5 + Math.random());
}

export function borrowFlow(data) {
  if (!data.token) return;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` };
  const listRes = http.get(`${BASE_URL}/books?limit=5`, { headers });
  if (listRes.status !== 200) return;
  const books = listRes.json('books') || [];
  if (books.length === 0) return;
  const bookId = books[0].id;
  const borrowRes = http.post(`${BASE_URL}/borrow`, JSON.stringify({ bookId }), { headers });
  check(borrowRes, { 'borrow accepted or conflict': (r) => r.status === 201 || r.status === 400 });
  sleep(1);
  const myRes = http.get(`${BASE_URL}/my-books`, { headers });
  check(myRes, { 'my-books 200': (r) => r.status === 200 });
  sleep(0.5 + Math.random());
}
