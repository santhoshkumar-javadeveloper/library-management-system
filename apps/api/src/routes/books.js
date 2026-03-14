import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdminOrL2 } from '../middleware/requireAdmin.js';
import * as bookController from '../controllers/bookController.js';

const router = Router();

router.get('/categories', bookController.getCategories);
router.get('/authors', bookController.getAuthors);
router.get('/suggest', bookController.getSuggestions);
router.get('/', bookController.listBooks);
router.get('/:id/same-genre', bookController.getSameGenre);
router.get('/:id', bookController.getBookById);

router.post('/', requireAdminOrL2, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('author').trim().notEmpty().withMessage('Author required'),
  body('category').optional().trim(),
  body('genre').optional().trim(),
  body('totalCopies').optional().isInt({ min: 1 }).toInt(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isURL(),
  body('loanPeriodDays').optional().isInt({ min: 1, max: 3650 }).toInt(),
  body('isbn').optional().trim(),
  body('description').optional().trim(),
  body('publishedDate').optional().trim(),
  body('originalPrice').optional().isFloat({ min: 0 }).toFloat(),
], bookController.createBook);

router.put('/:id', requireAdminOrL2, [
  param('id').isString().trim().isLength({ min: 24, max: 24 }).matches(/^[a-f0-9]{24}$/i),
  body('title').optional().trim().notEmpty(),
  body('author').optional().trim().notEmpty(),
  body('category').optional().trim(),
  body('genre').optional().trim(),
  body('totalCopies').optional().isInt({ min: 0 }).toInt(),
  body('availableCopies').optional().isInt({ min: 0 }).toInt(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isURL(),
  body('loanPeriodDays').optional().isInt({ min: 1, max: 3650 }).toInt(),
  body('isbn').optional().trim(),
  body('description').optional().trim(),
  body('publishedDate').optional().trim(),
  body('originalPrice').optional().isFloat({ min: 0 }).toFloat(),
], bookController.updateBook);

router.delete('/:id', requireAdminOrL2, bookController.deleteBook);

export default router;
