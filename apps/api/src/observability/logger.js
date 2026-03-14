import pino from 'pino';
import { trace } from '@opentelemetry/api';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext?.traceId;
    return traceId ? { traceId } : {};
  },
});

export function getLogger(bindings = {}) {
  return logger.child(bindings);
}

export default logger;
