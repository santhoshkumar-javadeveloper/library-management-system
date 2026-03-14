import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { BORROW_STATUS } from '../models/BorrowRecord.js';
import { SEED_BOOKS, isbn13FromIndex, globalNumberFromIndex } from '../seeds/seedBooks.js';
import * as borrowService from '../services/borrowService.js';
import * as adminService from '../services/adminService.js';

export async function getStats(req, res, next) {
  try {
    const [totalBooks, totalUsers, totalBorrows, activeBorrows, pendingRequests, pendingReturns] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      BorrowRecord.countDocuments(),
      BorrowRecord.countDocuments({ status: 'borrowed' }),
      BorrowRecord.countDocuments({ status: BORROW_STATUS.requested }),
      BorrowRecord.countDocuments({ status: BORROW_STATUS.borrowed }), // outstanding: admin marks returned at store
    ]);
    res.json({
      totalBooks,
      totalUsers,
      totalBorrows,
      activeBorrows,
      pendingRequests,
      pendingReturns,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const search = req.query.search || '';
    const users = await adminService.searchUsers({ search, limit: 100 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getUserBorrowHistory(req, res, next) {
  try {
    const userId = req.params.id;
    const history = await adminService.getBorrowHistoryForUser(userId);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function removeUser(req, res, next) {
  try {
    const userId = req.params.id;
    if (req.user && String(req.user.id) === String(userId)) {
      return res.status(400).json({ error: 'You cannot remove yourself.' });
    }
    const result = await adminService.removeUser(userId);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getPendingBorrowRequests(req, res, next) {
  try {
    const list = await adminService.getPendingBorrowRequests();
    res.json({ requests: list });
  } catch (err) {
    next(err);
  }
}

export async function approveBorrow(req, res, next) {
  try {
    const recordId = req.params.id;
    const overrideCopyLimit = req.body.overrideCopyLimit === true && req.user?.role === 'super_admin';
    const result = await borrowService.approveBorrow(recordId, req.user.id, { overrideCopyLimit });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result.record);
  } catch (err) {
    next(err);
  }
}

export async function getPendingReturns(req, res, next) {
  try {
    const list = await adminService.getPendingReturns();
    res.json({ returns: list });
  } catch (err) {
    next(err);
  }
}

export async function verifyReturn(req, res, next) {
  try {
    const recordId = req.params.id;
    const otp = req.body.otp != null ? String(req.body.otp).trim() : undefined;
    const verifyByEmailOrMobile = req.body.verifyByEmailOrMobile != null ? String(req.body.verifyByEmailOrMobile).trim() : undefined;
    const specialCase = req.body.specialCase === true;
    const result = await borrowService.verifyReturn(recordId, req.user.id, { otp, verifyByEmailOrMobile, specialCase });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true, recordId: result.recordId, fineAmount: result.fineAmount });
  } catch (err) {
    next(err);
  }
}

export async function generateReturnOtp(req, res, next) {
  try {
    const recordId = req.params.id;
    const result = await borrowService.generateReturnOtp(recordId, req.user.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true, returnOtp: result.returnOtp });
  } catch (err) {
    next(err);
  }
}

export async function outOfStockBooks(req, res, next) {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const list = await adminService.getOutOfStockBooks({ search, category, limit: 200 });
    res.json({ books: list });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    const { name, email, password, role, allowedCategories, mobile, allowExtraCopies } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const cats = Array.isArray(allowedCategories) ? allowedCategories.filter(Boolean).map((c) => String(c).trim()) : [];
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role,
      allowedCategories: role === 'l2_admin' ? cats : [],
      mobile: mobile ? String(mobile).trim() : null,
      allowExtraCopies: role === 'user' && allowExtraCopies === true,
    });
    res.status(201).json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
      allowedCategories: user.allowedCategories || [],
      allowExtraCopies: user.allowExtraCopies || false,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already registered' });
    next(err);
  }
}

export async function seedBooks(req, res, next) {
  try {
    const bookCount = await Book.countDocuments();
    if (bookCount > 0) {
      return res.json({ seeded: false, message: 'Books already exist', totalBooks: bookCount });
    }
    await Book.insertMany(SEED_BOOKS);
    res.status(201).json({ seeded: true, count: SEED_BOOKS.length, message: 'Sample books added' });
  } catch (err) {
    next(err);
  }
}

/** Backfill ISBN and globalNumber for all books missing either. One bulk update for speed. */
export async function backfillIsbn(req, res, next) {
  try {
    const books = await Book.find({
      $or: [
        { isbn: null }, { isbn: '' }, { isbn: { $exists: false } },
        { globalNumber: null }, { globalNumber: '' }, { globalNumber: { $exists: false } },
      ],
    })
      .sort({ _id: 1 })
      .select('_id isbn globalNumber')
      .lean();
    if (books.length === 0) {
      return res.json({ updated: 0, message: 'All books already have ISBN and global number' });
    }
    const startIndex = 1000000;
    const ops = books.map((b, i) => {
      const set = {};
      const needIsbn = b.isbn == null || String(b.isbn).trim() === '';
      const needGlobal = b.globalNumber == null || String(b.globalNumber).trim() === '';
      if (needIsbn) set.isbn = isbn13FromIndex(startIndex + i);
      if (needGlobal) set.globalNumber = globalNumberFromIndex(startIndex + i);
      if (Object.keys(set).length === 0) return null;
      return { updateOne: { filter: { _id: b._id }, update: { $set } } };
    }).filter(Boolean);
    if (ops.length === 0) {
      return res.json({ updated: 0, message: 'All books already have ISBN and global number' });
    }
    await Book.bulkWrite(ops);
    res.json({ updated: ops.length, message: `Updated ISBN/global number for ${ops.length} book(s)` });
  } catch (err) {
    next(err);
  }
}
