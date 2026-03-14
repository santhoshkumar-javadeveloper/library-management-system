import Book from '../models/Book.js';
import { config } from '../config/index.js';

const PAGE_SIZE = 20;

function toBookResponse(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    author: o.author,
    category: o.category ?? null,
    genre: o.genre ?? null,
    global_number: o.globalNumber ?? null,
    isbn: o.isbn ?? null,
    description: o.description ?? null,
    published_date: o.publishedDate ?? null,
    original_price: o.originalPrice ?? null,
    total_copies: o.totalCopies,
    available_copies: o.availableCopies,
    thumbnail_url: o.thumbnailUrl ?? null,
    loan_period_days: o.loanPeriodDays ?? 10,
    created_at: o.createdAt,
  };
}

const SORT_MAP = {
  title_asc: { title: 1 },
  title_desc: { title: -1 },
  author_asc: { author: 1 },
  author_desc: { author: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

function exactRegex(val) {
  return new RegExp(`^${String(val).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export async function listBooks(page = 1, limit = PAGE_SIZE, search = '', opts = {}) {
  const { category, genre, categoryOrGenre, categories, author, sort = 'title_asc', excludeId } = opts;
  const skip = (page - 1) * limit;
  const searchTerm = search && search.trim();
  let query = {};
  if (author && String(author).trim()) {
    const authorTrim = String(author).trim();
    query.$and = query.$and || [];
    query.$and.push({ author: { $regex: authorTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  }

  if (searchTerm) {
    const words = searchTerm.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      query.$or = [
        { title: { $regex: words[0], $options: 'i' } },
        { author: { $regex: words[0], $options: 'i' } },
        { category: { $regex: words[0], $options: 'i' } },
        { genre: { $regex: words[0], $options: 'i' } },
        { globalNumber: { $regex: words[0], $options: 'i' } },
        { isbn: { $regex: words[0], $options: 'i' } },
      ];
    } else {
      const andClauses = words.map((w) => ({
        $or: [
          { title: { $regex: w, $options: 'i' } },
          { author: { $regex: w, $options: 'i' } },
          { category: { $regex: w, $options: 'i' } },
          { genre: { $regex: w, $options: 'i' } },
          { globalNumber: { $regex: w, $options: 'i' } },
          { isbn: { $regex: w, $options: 'i' } },
        ],
      }));
      query.$and = query.$and || [];
      query.$and.push(...andClauses);
    }
  }
  const categoriesList = Array.isArray(categories) && categories.length > 0
    ? categories.map((c) => String(c).trim()).filter(Boolean)
    : null;
  if (categoriesList && categoriesList.length > 0) {
    const orCats = categoriesList.flatMap((c) => {
      const re = exactRegex(c);
      return [{ category: re }, { genre: re }];
    });
    query.$and = query.$and || [];
    query.$and.push({ $or: orCats });
  } else if (categoryOrGenre && String(categoryOrGenre).trim()) {
    const re = exactRegex(categoryOrGenre);
    query.$and = query.$and || [];
    query.$and.push({ $or: [{ category: re }, { genre: re }] });
  } else {
    if (category && category.trim()) query.category = exactRegex(category);
    if (genre && genre.trim()) query.genre = exactRegex(genre);
  }
  if (excludeId) {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
  }
  const sortObj = SORT_MAP[sort] || SORT_MAP.title_asc;
  if (config.injectAnomalies && searchTerm) {
    const all = await Book.find(query).sort(sortObj).lean();
    const lower = searchTerm.toLowerCase();
    const filtered = searchTerm
      ? all.filter(
          (r) =>
            (r.title && r.title.toLowerCase().includes(lower)) ||
            (r.author && r.author.toLowerCase().includes(lower)) ||
            (r.category && r.category && r.category.toLowerCase().includes(lower)) ||
            (r.genre && r.genre && r.genre.toLowerCase().includes(lower))
        )
      : all;
    const total = filtered.length;
    const books = filtered.slice(skip, skip + limit);
    return { books: books.map((b) => toBookResponse({ ...b, _id: b._id })), total, page, limit };
  }
  const [books, total] = await Promise.all([
    Book.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
    Book.countDocuments(query),
  ]);
  return {
    books: books.map((b) => toBookResponse({ ...b, _id: b._id })),
    total,
    page,
    limit,
  };
}

/** Autocomplete suggestions for search box: returns matching books by title, author, category, genre, isbn. */
export async function suggestSearch(q, limit = 10) {
  const term = (q && String(q).trim()) || '';
  if (term.length < 2) return [];
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safe, 'i');
  const query = {
    $or: [
      { title: re },
      { author: re },
      { category: re },
      { genre: re },
      { isbn: re },
      { globalNumber: re },
    ],
  };
  const books = await Book.find(query)
    .select('title author category')
    .sort({ title: 1 })
    .limit(Math.min(20, Math.max(1, limit)))
    .lean();
  return books.map((b) => ({
    id: String(b._id),
    title: b.title,
    author: b.author || '',
    category: b.category || null,
  }));
}

export async function getCategories() {
  const categories = await Book.distinct('category').then((arr) => arr.filter(Boolean).sort());
  const genres = await Book.distinct('genre').then((arr) => arr.filter(Boolean).sort());
  return { categories, genres };
}

/** Authors with their categories and book count (famous / most books first). */
export async function getAuthors() {
  const agg = await Book.aggregate([
    { $match: { author: { $exists: true, $ne: null, $ne: '' } } },
    { $group: { _id: '$author', categories: { $addToSet: '$category' }, genres: { $addToSet: '$genre' }, count: { $sum: 1 } } },
    { $project: { name: '$_id', categories: 1, genres: 1, bookCount: '$count', _id: 0 } },
    { $addFields: { categories: { $filter: { input: '$categories', as: 'c', cond: { $and: [{ $ne: ['$$c', null] }, { $ne: ['$$c', ''] }] } } } } },
    { $addFields: { genres: { $filter: { input: '$genres', as: 'g', cond: { $and: [{ $ne: ['$$g', null] }, { $ne: ['$$g', ''] }] } } } } },
    { $sort: { bookCount: -1, name: 1 } },
    { $limit: 200 },
  ]);
  return agg.map((a) => ({
    name: a.name,
    categories: (a.categories || []).sort(),
    genres: (a.genres || []).sort(),
    bookCount: a.bookCount || 0,
  }));
}

/** Recommendations based on current book: same category/genre and same author, mixed and deduped. */
export async function getSameGenreBooks(bookId, limit = 6) {
  const book = await Book.findById(bookId).lean();
  if (!book) return [];
  const categoryOrGenre = book.category || book.genre;
  const author = (book.author || '').trim();
  const excludeId = book._id;
  const seen = new Set();
  const out = [];
  if (categoryOrGenre) {
    const re = exactRegex(categoryOrGenre);
    const byCat = await Book.find({ _id: { $ne: excludeId }, $or: [{ category: re }, { genre: re }] }).sort({ title: 1 }).limit(limit).lean();
    for (const b of byCat) {
      const idStr = String(b._id);
      if (!seen.has(idStr)) { seen.add(idStr); out.push(b); }
    }
  }
  if (author && out.length < limit) {
    const byAuthor = await Book.find({ _id: { $ne: excludeId }, author: { $regex: author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }).sort({ title: 1 }).limit(limit - out.length).lean();
    for (const b of byAuthor) {
      const idStr = String(b._id);
      if (!seen.has(idStr)) { seen.add(idStr); out.push(b); }
      if (out.length >= limit) break;
    }
  }
  if (out.length < limit) {
    const excludeIds = [excludeId, ...out.map((b) => b._id)];
    const rest = await Book.find({ _id: { $nin: excludeIds } }).sort({ createdAt: -1 }).limit(limit - out.length).lean();
    for (const b of rest) {
      const idStr = String(b._id);
      if (!seen.has(idStr)) { seen.add(idStr); out.push(b); }
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit).map((b) => toBookResponse({ ...b, _id: b._id }));
}

export async function getBookById(id) {
  const { default: mongoose } = await import('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const book = await Book.findById(id).lean();
  return book ? toBookResponse({ ...book, _id: book._id }) : null;
}

function canManageCategory(category, role, allowedCategories) {
  if (role === 'super_admin' || role === 'admin') return true;
  if (role === 'l2_admin' && Array.isArray(allowedCategories) && allowedCategories.length > 0) {
    const cat = (category || '').trim();
    return cat && allowedCategories.some((c) => (c || '').trim().toLowerCase() === cat.toLowerCase());
  }
  return false;
}

export async function createBook(data, actor = {}) {
  const { role, allowedCategories } = actor;
  if (role && !canManageCategory(data.category || null, role, allowedCategories)) {
    return null;
  }
  const book = await Book.create({
    title: data.title,
    author: data.author,
    category: data.category || null,
    genre: data.genre || null,
    totalCopies: data.totalCopies ?? 1,
    availableCopies: data.availableCopies ?? data.totalCopies ?? 1,
    thumbnailUrl: data.thumbnailUrl || null,
    loanPeriodDays: data.loanPeriodDays ?? 10,
    isbn: data.isbn || null,
    description: data.description || null,
    publishedDate: data.publishedDate || null,
    originalPrice: data.originalPrice != null ? Number(data.originalPrice) : null,
  });
  return toBookResponse(book);
}

export async function updateBook(id, data, actor = {}) {
  const { default: mongoose } = await import('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const existing = await Book.findById(id).lean();
  if (!existing) return null;
  const { role, allowedCategories } = actor;
  const categoryToCheck = data.category !== undefined ? data.category : existing.category;
  if (role && !canManageCategory(categoryToCheck, role, allowedCategories)) {
    return null;
  }
  const totalCopies = data.totalCopies ?? existing.totalCopies;
  const availableCopies = data.availableCopies ?? existing.availableCopies;
  const loanPeriodDays = data.loanPeriodDays !== undefined ? data.loanPeriodDays : (existing.loanPeriodDays ?? 10);
  const book = await Book.findByIdAndUpdate(
    id,
    {
      title: data.title ?? existing.title,
      author: data.author ?? existing.author,
      category: data.category ?? existing.category,
      genre: data.genre ?? existing.genre,
      totalCopies,
      availableCopies,
      thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : existing.thumbnailUrl,
      loanPeriodDays,
      isbn: data.isbn !== undefined ? data.isbn || null : existing.isbn,
      description: data.description !== undefined ? data.description || null : existing.description,
      publishedDate: data.publishedDate !== undefined ? data.publishedDate || null : existing.publishedDate,
      originalPrice: data.originalPrice !== undefined ? (data.originalPrice != null ? Number(data.originalPrice) : null) : existing.originalPrice,
    },
    { new: true }
  ).lean();
  return book ? toBookResponse({ ...book, _id: book._id }) : null;
}

export async function deleteBook(id, actor = {}) {
  const { default: mongoose } = await import('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, error: 'Invalid book id' };
  const existing = await Book.findById(id).lean();
  if (!existing) return { success: false, error: 'Book not found' };
  const { role, allowedCategories } = actor;
  if (role && !canManageCategory(existing.category, role, allowedCategories)) {
    return { success: false, error: 'Not allowed to delete books in this category' };
  }
  const { default: BorrowRecord, BORROW_STATUS } = await import('../models/BorrowRecord.js');
  const borrowedCount = await BorrowRecord.countDocuments({ bookId: id, status: BORROW_STATUS.borrowed });
  if (borrowedCount > 0) {
    return { success: false, error: 'Cannot delete: some copies are currently borrowed. Wait for returns or verify returns first.' };
  }
  const result = await Book.findByIdAndDelete(id);
  return result ? { success: true } : { success: false, error: 'Delete failed' };
}
