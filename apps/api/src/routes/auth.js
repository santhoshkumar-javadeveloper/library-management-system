import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password at least 6 characters'),
  body('mobile').optional().trim(),
], authController.register);

router.post('/login', [
  body('email').trim().notEmpty().withMessage('Email or mobile required'),
  body('password').notEmpty().withMessage('Password required'),
], authController.login);

export default router;
