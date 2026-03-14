const BASE = import.meta.env.VITE_API_URL || '/api';
let effectiveBase = BASE;

export function getApiBase() {
  return effectiveBase;
}

function getToken() {
  return localStorage.getItem('token');
}

async function tryHealth(baseUrl) {
  const url = `${baseUrl.replace(/\/$/, '')}/health`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(id);
    const data = await res.json().catch(() => ({}));
    return res.ok && data.status === 'ok';
  } catch {
    clearTimeout(id);
    return false;
  }
}

export async function checkHealth() {
  const fallbackBase = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : '';
  const urls = [BASE];
  if (fallbackBase && fallbackBase !== BASE) urls.push(fallbackBase);
  for (const base of urls) {
    const ok = await tryHealth(base);
    if (ok) {
      effectiveBase = base;
      return true;
    }
  }
  return false;
}

export async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${effectiveBase}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_) {}
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export const api = {
  auth: {
    login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  quotes: {
    getRandom: () => request('/quotes/random'),
  },
  books: {
    list: (params = {}) => {
      const p = { ...params };
      if (Array.isArray(p.categories) && p.categories.length > 0) {
        p.categories = p.categories.join(',');
      }
      const sp = new URLSearchParams(p).toString();
      return request(`/books${sp ? `?${sp}` : ''}`);
    },
    get: (id) => request(`/books/${id}`),
    getCategories: () => request('/books/categories'),
    getAuthors: () => request('/books/authors'),
    suggest: (q, limit = 10) => request(`/books/suggest?q=${encodeURIComponent(q)}&limit=${limit}`),
    create: (body) => request('/books', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/books/${id}`, { method: 'DELETE' }),
  },
  health: () => checkHealth(),
  admin: {
    stats: () => request('/admin/stats'),
    seedBooks: () => request('/admin/seed-books', { method: 'POST' }),
    users: (params) => request(`/admin/users${params?.search ? `?search=${encodeURIComponent(params.search)}` : ''}`),
    userBorrowHistory: (userId) => request(`/admin/users/${userId}/borrow-history`),
    removeUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
    createUser: (body) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    borrowRequests: () => request('/admin/borrow-requests'),
    approveBorrow: (id, overrideCopyLimit) =>
      request(`/admin/borrow-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ overrideCopyLimit: !!overrideCopyLimit }) }),
    pendingReturns: () => request('/admin/returns'),
    verifyReturn: (id, body = {}) => request(`/admin/returns/${id}/verify`, { method: 'POST', body: JSON.stringify(body) }),
    generateReturnOtp: (id) => request(`/admin/returns/${id}/generate-otp`, { method: 'POST' }),
    outOfStockBooks: (params) => {
      const sp = new URLSearchParams(params || {}).toString();
      return request(`/admin/books/out-of-stock${sp ? `?${sp}` : ''}`);
    },
    backfillIsbn: () => request('/admin/books/backfill-isbn', { method: 'POST' }),
  },
};
