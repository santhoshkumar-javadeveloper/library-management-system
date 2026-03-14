import { trace } from '@opentelemetry/api';
import BorrowRecord from '../models/BorrowRecord.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';
import { getBookById } from './bookService.js';
import { fulfillReservation } from './reservationService.js';
import { BORROW_STATUS } from '../models/BorrowRecord.js';
import { withSpan } from '../observability/tracing.js';

const MAX_COPIES_SAME_BOOK = 1;
/** Predefined reasons for requesting an additional copy (user already has one). */
export const EXTRA_COPY_REASONS = [
  'Lost the book',
  'Need for extended reference',
  'Teaching / Education',
  'Research',
  'Other',
];
const FINE_PER_DAY_OVERDUE = 1;

async function dbOp(name, fn) {
  return withSpan('database_query', async () => {
    const span = trace.getActiveSpan();
    if (span) span.setAttribute('db.statement', name || 'query');
    return fn();
  });
}

const ADMIN_ROLES = ['admin', 'super_admin', 'l2_admin'];

/** User requests to borrow: creates record with status requested. No inventory change. Admins cannot borrow for themselves. */
export async function requestBorrow(userId, bookId) {
  return withSpan('business_logic', async () => {
    const user = await User.findById(userId).select('role').lean();
    if (user && ADMIN_ROLES.includes(user.role)) {
      return { success: false, error: 'Admins cannot request borrows for themselves. Use the admin portal to manage inventory and user requests.' };
    }
    const book = await getBookById(bookId);
    if (!book) return { success: false, error: 'Book not found' };
    if ((book.available_copies ?? 0) < 1) return { success: false, error: 'No copies available. You can reserve it and collect when in stock.' };
    const existingRequest = await dbOp('find_pending_request', () =>
      BorrowRecord.findOne({ userId, bookId, status: BORROW_STATUS.requested }).lean()
    );
    if (existingRequest) return { success: false, error: 'You already have a pending request for this book' };
    const record = await dbOp('insert_borrow_request', () =>
      BorrowRecord.create({
        userId,
        bookId,
        status: BORROW_STATUS.requested,
        requestedAt: new Date(),
        borrowDate: new Date(),
      })
    );
    const recordObj = record.toObject();
    return {
      success: true,
      record: {
        id: String(recordObj._id),
        user_id: String(recordObj.userId),
        book_id: String(recordObj.bookId),
        status: recordObj.status,
        requested_at: recordObj.requestedAt,
        message: 'Request submitted. Visit the library with your email/mobile; admin will approve and hand over the book.',
      },
    };
  });
}

/** Admin approves a borrow request. One copy per user per book; extra copy allowed when request has reason or override. */
export async function approveBorrow(recordId, adminId, opts = {}) {
  const { overrideCopyLimit = false } = opts;
  const record = await BorrowRecord.findById(recordId).populate('bookId').populate('userId', 'allowExtraCopies');
  if (!record) return { success: false, error: 'Borrow request not found' };
  if (record.status !== BORROW_STATUS.requested) return { success: false, error: 'Request already processed' };
  const book = await Book.findById(record.bookId).lean();
  if (!book) return { success: false, error: 'Book not found' };
  if (book.availableCopies < 1) return { success: false, error: 'No copies available' };

  const isExtraCopyRequest = !!(record.extraCopyReason && record.extraCopyReason.trim());
  const user = await User.findById(record.userId).lean();
  const canExtra = user?.allowExtraCopies === true || overrideCopyLimit || isExtraCopyRequest;
  if (!canExtra) {
    const borrowedCount = await BorrowRecord.countDocuments({
      userId: record.userId,
      bookId: record.bookId,
      status: BORROW_STATUS.borrowed,
    });
    if (borrowedCount >= MAX_COPIES_SAME_BOOK) {
      return { success: false, error: `User already has ${MAX_COPIES_SAME_BOOK} copy/copies of this book. Need special permission to allow more.` };
    }
  }

  const loanDays = book.loanPeriodDays ?? 10;
  const approvedAt = new Date();
  const dueDate = new Date(approvedAt);
  dueDate.setDate(dueDate.getDate() + loanDays);

  const returnOtp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  record.status = BORROW_STATUS.borrowed;
  record.approvedAt = approvedAt;
  record.approvedBy = adminId;
  record.dueDate = dueDate;
  record.borrowDate = approvedAt;
  record.returnOtp = returnOtp;
  record.returnOtpGeneratedAt = new Date();
  await record.save();

  await Book.findByIdAndUpdate(record.bookId, { $inc: { availableCopies: -1 } });

const reservation = await dbOp('find_reservation', () =>
      Reservation.findOne({ userId: record.userId, bookId: record.bookId, status: 'reserved' }).lean()
    );
    if (reservation) await fulfillReservation(reservation._id, record._id);

  return {
    success: true,
    record: {
      id: String(record._id),
      due_date: dueDate,
      status: BORROW_STATUS.borrowed,
    },
  };
}

/** User marks book as returned. Status becomes returned_pending_verify; inventory unchanged until admin verifies. */
export async function userReturn(userId, recordIdOrBookId) {
  let record = await BorrowRecord.findOne({
    _id: recordIdOrBookId,
    userId,
    status: BORROW_STATUS.borrowed,
  }).lean();
  if (!record) {
    record = await BorrowRecord.findOne({
      bookId: recordIdOrBookId,
      userId,
      status: BORROW_STATUS.borrowed,
    }).lean();
  }
  if (!record) return { success: false, error: 'Borrow record not found' };

  const returnedAt = new Date();
  await BorrowRecord.updateOne(
    { _id: record._id },
    { status: BORROW_STATUS.returned_pending_verify, returnedAt, returnDate: returnedAt }
  );
  return { success: true, recordId: String(record._id), message: 'Return recorded. Admin will verify and then inventory will be updated.' };
}

/** Admin verifies return at store. Customer must share the Return OTP (visible in their portal). If OTP matches, process return. Super_admin can: generate new OTP, verify by customer email/mobile, or use special case to return anyway. */
export async function verifyReturn(recordId, adminId, opts = {}) {
  const { otp, verifyByEmailOrMobile, specialCase } = opts;
  const record = await BorrowRecord.findById(recordId).populate('userId', 'email mobile');
  if (!record) return { success: false, error: 'Record not found' };
  if (record.status !== BORROW_STATUS.borrowed && record.status !== BORROW_STATUS.returned_pending_verify) {
    return { success: false, error: 'Record is not outstanding or pending verification' };
  }

  const adminUser = await User.findById(adminId).select('role').lean();
  const isSuperAdmin = adminUser?.role === 'super_admin';

  let allowVerify = false;
  if (specialCase && isSuperAdmin) {
    allowVerify = true;
    record.returnSpecialCase = true;
  } else if (verifyByEmailOrMobile && isSuperAdmin && typeof verifyByEmailOrMobile === 'string') {
    const val = verifyByEmailOrMobile.trim().toLowerCase();
    const u = record.userId;
    const emailMatch = u?.email && u.email.toLowerCase() === val;
    const mobileMatch = u?.mobile && String(u.mobile).trim() === val;
    if (emailMatch || mobileMatch) allowVerify = true;
  } else if (otp != null && String(otp).trim() !== '') {
    if (record.returnOtp && String(record.returnOtp).trim() === String(otp).trim()) allowVerify = true;
  }

  if (!allowVerify) {
    if (specialCase && !isSuperAdmin) return { success: false, error: 'Only super admin can use special case override.' };
    if ((verifyByEmailOrMobile || specialCase) && !isSuperAdmin) return { success: false, error: 'Only super admin can verify by email/mobile or special case.' };
    return { success: false, error: 'Invalid or missing OTP. Ask the customer for the Return OTP shown in their portal, or use super admin options.' };
  }

  const now = new Date();
  if (!record.returnedAt) record.returnedAt = now;
  let fineAmount = 0;
  if (record.dueDate && record.returnedAt > record.dueDate) {
    const daysOverdue = Math.ceil((record.returnedAt - record.dueDate) / (24 * 60 * 60 * 1000));
    fineAmount = daysOverdue * FINE_PER_DAY_OVERDUE;
  }

  record.status = BORROW_STATUS.completed;
  record.verifiedAt = now;
  record.verifiedBy = adminId;
  record.fineAmount = fineAmount;
  await record.save();

  await Book.findByIdAndUpdate(record.bookId, { $inc: { availableCopies: 1 } });

  return {
    success: true,
    recordId: String(record._id),
    fineAmount,
  };
}

/** Super admin only: generate a new Return OTP for a borrow record (e.g. if customer lost it). Returns the new OTP. */
export async function generateReturnOtp(recordId, adminId) {
  const adminUser = await User.findById(adminId).select('role').lean();
  if (adminUser?.role !== 'super_admin') return { success: false, error: 'Only super admin can generate a new Return OTP.' };
  const record = await BorrowRecord.findById(recordId);
  if (!record) return { success: false, error: 'Record not found' };
  if (record.status !== BORROW_STATUS.borrowed) return { success: false, error: 'Record is not currently borrowed.' };
  const newOtp = String(Math.floor(100000 + Math.random() * 900000));
  record.returnOtp = newOtp;
  record.returnOtpGeneratedAt = new Date();
  await record.save();
  return { success: true, returnOtp: newOtp };
}

export async function getMyBorrowedBooks(userId) {
  const list = await dbOp(
    'get_my_borrowed',
    () =>
      BorrowRecord.find({ userId, status: BORROW_STATUS.borrowed })
        .populate('bookId', 'title author category thumbnailUrl loanPeriodDays')
        .sort({ approvedAt: -1, borrowDate: -1 })
        .lean()
  );
  for (const r of list) {
    if (!r.returnOtp) {
      const newOtp = String(Math.floor(100000 + Math.random() * 900000));
      await BorrowRecord.updateOne({ _id: r._id }, { returnOtp: newOtp, returnOtpGeneratedAt: new Date() });
      r.returnOtp = newOtp;
    }
  }
  return list.map((r) => {
    const b = r.bookId || {};
    return {
      id: String(r._id),
      book_id: String(r.bookId?._id || r.bookId),
      borrow_date: r.approvedAt || r.borrowDate,
      return_date: r.returnedAt || r.returnDate,
      due_date: r.dueDate,
      status: r.status,
      title: b.title,
      author: b.author,
      category: b.category,
      thumbnail_url: b.thumbnailUrl || null,
      fine_amount: r.fineAmount ?? 0,
      loan_period_days: b.loanPeriodDays ?? 10,
      return_otp: r.returnOtp || null,
    };
  });
}

/** For "My books" and history: all statuses including completed (returned). */
export async function getMyBooksFull(userId) {
  const list = await BorrowRecord.find({ userId })
    .populate('bookId', 'title author category thumbnailUrl loanPeriodDays')
    .sort({ createdAt: -1 })
    .lean();
  for (const r of list) {
    if (r.status === BORROW_STATUS.borrowed && !r.returnOtp) {
      const newOtp = String(Math.floor(100000 + Math.random() * 900000));
      await BorrowRecord.updateOne({ _id: r._id }, { returnOtp: newOtp, returnOtpGeneratedAt: new Date() });
      r.returnOtp = newOtp;
    }
  }
  return list.map((r) => {
    const b = r.bookId || {};
    return {
      id: String(r._id),
      book_id: String(r.bookId?._id || r.bookId),
      borrow_date: r.approvedAt || r.borrowDate,
      return_date: r.returnedAt || r.returnDate,
      due_date: r.dueDate,
      verified_at: r.verifiedAt,
      status: r.status,
      title: b.title,
      author: b.author,
      category: b.category,
      thumbnail_url: b.thumbnailUrl || null,
      fine_amount: r.fineAmount ?? 0,
      requested_at: r.requestedAt,
      return_otp: r.status === BORROW_STATUS.borrowed ? (r.returnOtp || null) : null,
    };
  });
}

/** Due soon (tomorrow or today) and overdue for notifications */
export function getDueSoonAndOverdue(records) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueSoon = [];
  const overdue = [];
  for (const r of records) {
    if (r.status !== BORROW_STATUS.borrowed || !r.due_date) continue;
    const d = new Date(r.due_date);
    if (d < now) overdue.push(r);
    else if (d.toDateString() === now.toDateString() || d.toDateString() === tomorrow.toDateString()) dueSoon.push(r);
  }
  return { dueSoon, overdue };
}
