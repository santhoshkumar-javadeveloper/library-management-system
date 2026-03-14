import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const borrowOperationsTotal = new Counter({
  name: 'borrow_operations_total',
  help: 'Total borrow/return operations',
  labelNames: ['operation'],
  registers: [register],
});

function getRoute(path) {
  if (path === '/metrics') return '/metrics';
  if (/^\/books\/\d+$/.test(path)) return '/books/:id';
  return path || '/';
}

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  const route = getRoute(req.path);
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDurationSeconds.observe({ method: req.method, route }, duration);
  });
  next();
}
