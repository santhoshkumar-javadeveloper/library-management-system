import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('library-backend', '1.0.0');

export function getTracer() {
  return tracer;
}

export async function withSpan(name, fn) {
  const span = tracer.startSpan(name);
  const ctx = trace.setSpan(context.active(), span);
  return context.with(ctx, async () => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 });
      return result;
    } catch (err) {
      span.setStatus({ code: 2, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
