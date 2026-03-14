import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import borrowRoutes from './routes/borrow.js';
import quoteRoutes from './routes/quotes.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/error.js';
import { metricsMiddleware, register } from './observability/metrics.js';
import { traceMiddleware } from './middleware/traceId.js';

const app = express();

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'library-api', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.status(200).json({ message: 'Library API', docs: 'Open the app at http://127.0.0.1:5174', health: '/health', books: '/books' }));

app.use(cors());
app.use(express.json());
app.use(traceMiddleware);
app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(authRoutes);   // POST /register, POST /login
app.use('/books', bookRoutes);
app.use(borrowRoutes); // POST /borrow, POST /return, GET /my-books
app.use('/quotes', quoteRoutes); // GET /quotes/random
app.use('/admin', adminRoutes); // GET /admin/stats (admin only)

app.use(errorHandler);
export default app;
