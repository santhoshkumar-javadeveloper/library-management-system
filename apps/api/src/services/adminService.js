import BorrowRecord from '../models/BorrowRecord.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import { BORROW_STATUS } from '../models/BorrowRecord.js';

export async function getPendingBorrowRequests() {
  const list = await BorrowRecord.find({ status: BORROW_STATUS.requested })
    .populate('userId', 'name email mobile')
    .populate('bookId', 'title author category')
    .sort({ requestedAt: 1 })
    .lean();
  const userIdRef = (r) => (r.userId && typeof r.userId === 'object' && r.userId._id ? r.userId._id : r.userId);
  const bookIdRef = (r) => (r.bookId && typeof r.bookId === 'object' && r.bookId._id ? r.bookId._id : r.bookId);
  const withReservation = await Promise.all(
    list.map(async (r) => {
      const uid = userIdRef(r);
      const bid = bookIdRef(r);
      const res = await Reservation.findOne({
        userId: uid,
        bookId: bid,
        status: 'reserved',
      }).lean();
      return {
        id: String(r._id),
        user_id: String(uid),
        user_name: (r.userId && r.userId.name) || 'Unknown',
        user_email: (r.userId && r.userId.email) || '',
        user_mobile: (r.userId && r.userId.mobile) || null,
        book_id: String(bid),
        book_title: (r.bookId && r.bookId.title) || 'Unknown',
        book_author: (r.bookId && r.bookId.author) || '',
        book_category: (r.bookId && r.bookId.category) || null,
        requested_at: r.requestedAt,
        reserved_from_home: !!res,
        extra_copy_reason: r.extraCopyReason || null,
        extra_copy_reason_custom: r.extraCopyReasonCustom || null,
      };
    })
  );
  return withReservation;
}

/** Returns list = all currently borrowed (outstanding). Admin marks as returned when customer brings book to store. */
export async function getPendingReturns() {
  const list = await BorrowRecord.find({ status: BORROW_STATUS.borrowed })
    .populate('userId', 'name email mobile')
    .populate('bookId', 'title author')
    .sort({ dueDate: 1 })
    .lean();
  return list.map((r) => ({
    id: String(r._id),
    user_id: r.userId ? String(r.userId._id || r.userId) : '',
    user_name: r.userId?.name ?? 'Unknown',
    user_email: r.userId?.email ?? '',
    user_mobile: r.userId?.mobile || null,
    book_id: r.bookId ? String(r.bookId._id || r.bookId) : '',
    book_title: r.bookId?.title ?? 'Unknown',
    book_author: r.bookId?.author ?? '',
    borrowed_at: r.approvedAt || r.borrowDate,
    due_date: r.dueDate,
  }));
}

export async function searchUsers(opts = {}) {
  const { search = '', role, limit = 50 } = opts;
  const query = {};
  if (role) query.role = role;
  if (search && search.trim()) {
    const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { mobile: { $regex: term, $options: 'i' } },
    ];
  }
  const users = await User.find(query)
    .select('name email mobile role allowedCategories createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const withCounts = await Promise.all(
    users.map(async (u) => {
      const borrowedCount = await BorrowRecord.countDocuments({
        userId: u._id,
        status: BORROW_STATUS.borrowed,
      });
      const reservationCount = await Reservation.countDocuments({
        userId: u._id,
        status: 'reserved',
      });
      const totalBorrows = await BorrowRecord.countDocuments({ userId: u._id });
      return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        mobile: u.mobile || null,
        role: u.role,
        allowedCategories: u.allowedCategories || [],
        createdAt: u.createdAt,
        borrowed_count: borrowedCount,
        reservation_count: reservationCount,
        total_borrows: totalBorrows,
      };
    })
  );
  return withCounts;
}

/** Full borrow/return history for a user (admin view). */
export async function getBorrowHistoryForUser(userId) {
  const list = await BorrowRecord.find({ userId })
    .populate('bookId', 'title author category')
    .sort({ createdAt: -1 })
    .lean();
  return list.map((r) => {
    const b = r.bookId || {};
    return {
      id: String(r._id),
      book_id: String(r.bookId?._id || r.bookId),
      book_title: b.title ?? 'Unknown',
      book_author: b.author ?? '',
      book_category: b.category ?? null,
      status: r.status,
      requested_at: r.requestedAt,
      borrowed_at: r.approvedAt || r.borrowDate,
      due_date: r.dueDate,
      returned_at: r.returnedAt,
      verified_at: r.verifiedAt,
      fine_amount: r.fineAmount ?? 0,
    };
  });
}

export async function getOutOfStockBooks(opts = {}) {
  const { search = '', category = '', limit = 100 } = opts;
  const query = { $or: [{ availableCopies: { $lte: 0 } }, { availableCopies: { $exists: false } }] };
  if (search && search.trim()) {
    const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { author: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { genre: { $regex: term, $options: 'i' } },
      ],
    });
  }
  if (category && category.trim()) {
    const catRegex = new RegExp(`^${String(category).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    query.$and = query.$and || [];
    query.$and.push({ $or: [{ category: catRegex }, { genre: catRegex }] });
  }
  const books = await Book.find(query)
    .sort({ title: 1 })
    .limit(limit)
    .lean();
  return books.map((b) => ({
    id: String(b._id),
    title: b.title,
    author: b.author,
    category: b.category,
    genre: b.genre,
    total_copies: b.totalCopies,
    available_copies: b.availableCopies ?? 0,
  }));
}

/** Remove user from platform. Fails if user has any borrowed books not yet returned. */
export async function removeUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return { success: false, error: 'User not found' };
  if (user.role === 'super_admin') return { success: false, error: 'Cannot remove a super admin.' };
  const borrowedCount = await BorrowRecord.countDocuments({
    userId,
    status: BORROW_STATUS.borrowed,
  });
  if (borrowedCount > 0) {
    return { success: false, error: 'Cannot remove user: they have borrowed books not yet returned. Ask them to return the books and verify returns first.' };
  }
  await User.findByIdAndDelete(userId);
  return { success: true };
}
