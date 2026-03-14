import { Router } from 'express';
import * as quoteController from '../controllers/quoteController.js';

const router = Router();

router.get('/random', quoteController.getRandom);

export default router;
