import { trace, context } from '@opentelemetry/api';
import { getTracer } from '../observability/tracing.js';

export function traceMiddleware(req, res, next) {
  const tracer = getTracer();
  const span = tracer.startSpan('controller_execution', {
    attributes: {
      'http.method': req.method,
      'http.route': req.path || req.route?.path || req.url,
    },
  });
  const spanContext = span.spanContext();
  if (spanContext?.traceId) {
    res.setHeader('X-Trace-Id', spanContext.traceId);
  }
  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.end();
  });
  const ctx = trace.setSpan(context.active(), span);
  context.with(ctx, () => next());
}
