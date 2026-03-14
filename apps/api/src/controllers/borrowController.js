import { validationResult } from 'express-validator';
import * as borrowService from '../services/borrowService.js';
import * as reservationService from '../services/reservationService.js';
import { getLogger } from '../observability/logger.js';
import { borrowOperationsTotal } from '../observability/metrics.js';
import { getTracer } from '../observability/tracing.js';

const log = getLogger();

export async function borrow(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log.warn({ event: 'validation_error', errors: errors.array() }, 'Validation failed');
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const userId = req.user.id;
    const bookId = req.body.bookId;
    const extraCopyReason = (req.body.extraCopyReason || '').toString().trim() || undefined;
    const extraCopyReasonCustom = (req.body.extraCopyReasonCustom || '').toString().trim() || undefined;
    const result = await borrowService.requestBorrow(userId, bookId, { extraCopyReason, extraCopyReasonCustom });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    borrowOperationsTotal.inc({ operation: 'borrow' });
    log.info({ event: 'borrow_requested', userId, bookId, recordId: result.record?.id }, 'Borrow requested');
    const responseSpan = getTracer().startSpan('response_formatting');
    try {
      res.status(201).json(result.record);
    } finally {
      responseSpan.end();
    }
  } catch (err) {
    next(err);
  }
}

/** Returns are recorded only at the library via admin "Mark returns". No self-service return. */
export async function returnBook(req, res, next) {
  try {
    return res.status(403).json({
      error: 'Returns are recorded only at the library. Bring the book to the library and staff will mark it returned.',
    });
  } catch (err) {
    next(err);
  }
}

export async function myBooks(req, res, next) {
  try {
    const list = await borrowService.getMyBooksFull(req.user.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

/** Borrowed only (for backward compat and simple list) */
export async function myBorrowedOnly(req, res, next) {
  try {
    const list = await borrowService.getMyBorrowedBooks(req.user.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

/** Due soon / overdue alerts for the logged-in user */
export async function dueAlerts(req, res, next) {
  try {
    const list = await borrowService.getMyBorrowedBooks(req.user.id);
    const { dueSoon, overdue } = borrowService.getDueSoonAndOverdue(list);
    res.json({ dueSoon, overdue });
  } catch (err) {
    next(err);
  }
}

export async function reserve(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const userId = req.user.id;
    const bookId = req.body.bookId;
    const result = await reservationService.createReservation(userId, bookId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.reservation);
  } catch (err) {
    next(err);
  }
}

export async function cancelReservation(req, res, next) {
  try {
    const reservationId = req.params.id || req.body.reservationId;
    if (!reservationId) return res.status(400).json({ error: 'reservationId required' });
    const result = await reservationService.cancelReservation(req.user.id, reservationId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function myReservations(req, res, next) {
  try {
    const list = await reservationService.getMyReservations(req.user.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}
