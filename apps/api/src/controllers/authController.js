import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
import { getLogger } from '../observability/logger.js';

const log = getLogger();

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log.warn({ event: 'validation_error', errors: errors.array() }, 'Validation failed');
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const { name, email, password, mobile } = req.body;
    const user = await authService.register(name, email, password, mobile);
    log.info({ event: 'user_registered', userId: user.id, email: user.email }, 'User registered');
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already registered' });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log.warn({ event: 'validation_error', errors: errors.array() }, 'Validation failed');
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const emailOrMobile = (req.body.email || req.body.emailOrMobile || '').toString().trim();
    const { password } = req.body;
    const result = await authService.login(emailOrMobile, password);
    if (!result) {
      log.warn({ event: 'login_failure', emailOrMobile }, 'Login failed');
      return res.status(401).json({ error: 'Invalid email, mobile or password' });
    }
    log.info({ event: 'login_success', userId: result.user.id, email: result.user.email }, 'Login success');
    res.json(result);
  } catch (err) {
    next(err);
  }
}
