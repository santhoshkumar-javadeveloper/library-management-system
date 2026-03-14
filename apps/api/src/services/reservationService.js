import { trace } from '@opentelemetry/api';
import Reservation from '../models/Reservation.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { getBookById } from './bookService.js';
import { withSpan } from '../observability/tracing.js';

async function dbOp(name, fn) {
  return withSpan('database_query', async () => {
    const span = trace.getActiveSpan();
    if (span) span.setAttribute('db.statement', name || 'query');
    return fn();
  });
}

const ADMIN_ROLES = ['admin', 'super_admin', 'l2_admin'];

export async function createReservation(userId, bookId) {
  return withSpan('business_logic', async () => {
    const user = await User.findById(userId).select('role').lean();
    if (user && ADMIN_ROLES.includes(user.role)) {
      return { success: false, error: 'Admins cannot reserve books for themselves. Use the admin portal to manage inventory and user requests.' };
    }
    const book = await getBookById(bookId);
    if (!book) return { success: false, error: 'Book not found' };
    const existing = await dbOp('find_reservation', () =>
      Reservation.findOne({ userId, bookId, status: 'reserved' }).lean()
    );
    if (existing) return { success: false, error: 'You already reserved this book' };
    const reservation = await dbOp('create_reservation', () =>
      Reservation.create({ userId, bookId, status: 'reserved' })
    );
    return {
      success: true,
      reservation: {
        id: String(reservation._id),
        book_id: bookId,
        book_title: book.title,
        status: 'reserved',
        created_at: reservation.createdAt,
      },
    };
  });
}

export async function cancelReservation(userId, reservationId) {
  const res = await Reservation.findOne({ _id: reservationId, userId, status: 'reserved' });
  if (!res) return { success: false, error: 'Reservation not found or already fulfilled/cancelled' };
  res.status = 'cancelled';
  await res.save();
  return { success: true };
}

export async function getMyReservations(userId) {
  const list = await Reservation.find({ userId, status: 'reserved' })
    .populate('bookId', 'title author category thumbnailUrl')
    .sort({ createdAt: -1 })
    .lean();
  return list.map((r) => ({
    id: String(r._id),
    book_id: String(r.bookId?._id || r.bookId),
    book_title: r.bookId?.title,
    author: r.bookId?.author,
    category: r.bookId?.category,
    thumbnail_url: r.bookId?.thumbnailUrl,
    status: r.status,
    created_at: r.createdAt,
  }));
}

export async function getReservationForUserAndBook(userId, bookId) {
  const r = await Reservation.findOne({ userId, bookId, status: 'reserved' }).lean();
  return r ? { id: String(r._id), createdAt: r.createdAt } : null;
}

export async function fulfillReservation(reservationId, borrowRecordId) {
  const r = await Reservation.findById(reservationId);
  if (!r || r.status !== 'reserved') return false;
  r.status = 'fulfilled';
  r.fulfilledAt = new Date();
  r.borrowRecordId = borrowRecordId;
  await r.save();
  return true;
}
