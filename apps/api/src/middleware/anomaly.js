import { config } from '../config/index.js';

/**
 * Injects anomalies when INJECT_ANOMALIES=true for demo:
 * - 2s delay on borrow
 * - ~10% random 500
 */
export async function injectBorrowAnomalies(req, res, next) {
  if (!config.injectAnomalies) return next();
  await new Promise((r) => setTimeout(r, 2000));
  if (Math.random() < 0.1) {
    return res.status(500).json({ error: 'Simulated server error (anomaly)' });
  }
  next();
}
