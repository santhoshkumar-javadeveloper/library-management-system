import { Router } from 'express';
import { body } from 'express-validator';
import { requireAdmin, requireSuperAdmin } from '../middleware/requireAdmin.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.get('/stats', requireAdmin, adminController.getStats);
router.get('/users', requireAdmin, adminController.listUsers);
router.get('/users/:id/borrow-history', requireAdmin, adminController.getUserBorrowHistory);
router.delete('/users/:id', requireAdmin, adminController.removeUser);
router.post('/users', requireSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password at least 6 characters'),
  body('role').isIn(['user', 'l2_admin', 'admin']).withMessage('Role must be user, l2_admin, or admin'),
  body('allowedCategories').optional().isArray(),
  body('allowedCategories.*').optional().trim().notEmpty(),
  body('mobile').optional().trim(),
  body('allowExtraCopies').optional().isBoolean(),
], adminController.createUser);
router.get('/borrow-requests', requireAdmin, adminController.getPendingBorrowRequests);
router.post('/borrow-requests/:id/approve', requireAdmin, adminController.approveBorrow);
router.get('/returns', requireAdmin, adminController.getPendingReturns);
router.post('/returns/:id/verify', requireAdmin, adminController.verifyReturn);
router.post('/returns/:id/generate-otp', requireAdmin, adminController.generateReturnOtp);
router.get('/books/out-of-stock', requireAdmin, adminController.outOfStockBooks);
router.post('/seed-books', requireAdmin, adminController.seedBooks);
router.post('/books/backfill-isbn', requireAdmin, adminController.backfillIsbn);

export default router;
