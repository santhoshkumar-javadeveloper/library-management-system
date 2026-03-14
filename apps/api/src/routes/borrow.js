import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { injectBorrowAnomalies } from '../middleware/anomaly.js';
import * as borrowController from '../controllers/borrowController.js';

const router = Router();

const bookIdValidator = () => body('bookId').isString().trim().isLength({ min: 24, max: 24 }).matches(/^[a-f0-9]{24}$/i).withMessage('Valid bookId required');
const recordIdValidator = () => body('recordId').optional().isString().trim().isLength({ min: 24, max: 24 }).matches(/^[a-f0-9]{24}$/i);
const mongoIdValidator = () => body('bookId').optional().isString().trim().isLength({ min: 24, max: 24 }).matches(/^[a-f0-9]{24}$/i);

router.post('/borrow', authMiddleware, injectBorrowAnomalies, [
  bookIdValidator(),
  body('extraCopyReason').optional().trim(),
  body('extraCopyReasonCustom').optional().trim(),
], borrowController.borrow);
router.post('/return', authMiddleware, [recordIdValidator(), mongoIdValidator()], borrowController.returnBook);
router.get('/my-books', authMiddleware, borrowController.myBooks);
router.get('/due-alerts', authMiddleware, borrowController.dueAlerts);
router.post('/reserve', authMiddleware, [bookIdValidator()], borrowController.reserve);
router.delete('/reservations/:id', authMiddleware, borrowController.cancelReservation);
router.get('/reservations', authMiddleware, borrowController.myReservations);

export default router;
