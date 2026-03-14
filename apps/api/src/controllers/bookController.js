import { validationResult } from 'express-validator';
import * as bookService from '../services/bookService.js';

const MONGO_ID_REGEX = /^[a-f0-9]{24}$/i;

export async function getCategories(req, res, next) {
  try {
    const result = await bookService.getCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAuthors(req, res, next) {
  try {
    const authors = await bookService.getAuthors();
    res.json({ authors });
  } catch (err) {
    next(err);
  }
}

export async function getSuggestions(req, res, next) {
  try {
    const q = (req.query.q || '').toString();
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const suggestions = await bookService.suggestSearch(q, limit);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

export async function listBooks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || '').toString();
    const category = (req.query.category || '').toString().trim() || undefined;
    const genre = (req.query.genre || '').toString().trim() || undefined;
    const categoryOrGenre = (req.query.categoryOrGenre || '').toString().trim() || undefined;
    const categoriesRaw = req.query.categories;
    let categories;
    if (categoriesRaw == null) {
      categories = undefined;
    } else if (Array.isArray(categoriesRaw)) {
      categories = categoriesRaw.map((c) => String(c).trim()).filter(Boolean);
    } else {
      const str = String(categoriesRaw).trim();
      categories = str ? str.split(',').map((c) => c.trim()).filter(Boolean) : undefined;
    }
    if (categories && categories.length === 0) categories = undefined;
    const author = (req.query.author || '').toString().trim() || undefined;
    const sort = (req.query.sort || 'title_asc').toString();
    const excludeId = (req.query.excludeId || '').toString().trim() || undefined;
    const result = await bookService.listBooks(page, limit, search, { category, genre, categoryOrGenre, categories, author, sort, excludeId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSameGenre(req, res, next) {
  try {
    const id = req.params.id;
    if (!MONGO_ID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid book id' });
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const books = await bookService.getSameGenreBooks(id, limit);
    res.json({ books });
  } catch (err) {
    next(err);
  }
}

export async function getBookById(req, res, next) {
  try {
    const id = req.params.id;
    if (!MONGO_ID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid book id' });
    const book = await bookService.getBookById(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
}

export async function createBook(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    const book = await bookService.createBook(req.body, { role: req.user.role, allowedCategories: req.user.allowedCategories });
    if (!book) return res.status(403).json({ error: 'Not allowed to add books in this category' });
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
}

export async function updateBook(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    const book = await bookService.updateBook(req.params.id, req.body, { role: req.user.role, allowedCategories: req.user.allowedCategories });
    if (!book) return res.status(403).json({ error: 'Book not found or not allowed to edit this category' });
    res.json(book);
  } catch (err) {
    next(err);
  }
}

export async function deleteBook(req, res, next) {
  try {
    const id = req.params.id;
    if (!MONGO_ID_REGEX.test(id)) return res.status(400).json({ error: 'Invalid book id' });
    const result = await bookService.deleteBook(id, { role: req.user.role, allowedCategories: req.user.allowedCategories });
    if (!result.success) return res.status(400).json({ error: result.error || 'Cannot delete book' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
