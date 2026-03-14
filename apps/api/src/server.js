import './config/otel.js';
import app from './app.js';
import { config } from './config/index.js';
import { connectDb } from './config/database.js';
import { getLogger } from './observability/logger.js';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Book from './models/Book.js';
import { SEED_BOOKS } from './seeds/seedBooks.js';

const log = getLogger();

async function waitForDb(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await connectDb();
      conn.on('error', (err) => log.error(err, 'MongoDB connection error'));
      return conn;
    } catch (e) {
      log.warn({ attempt: i + 1 }, 'Waiting for MongoDB...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Database not available');
}

async function seedData() {
  const superAdminExists = await User.findOne({ role: 'super_admin' });
  if (!superAdminExists) {
    const hash = await bcrypt.hash('super123', 10);
    await User.create({ name: 'Super Admin', email: 'superadmin@library.com', password: hash, role: 'super_admin' });
    log.info('Super admin created: superadmin@library.com / super123');
  }
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@library.com', password: hash, role: 'admin' });
    log.info('Admin user created: admin@library.com / admin123');
  }
  const bookCount = await Book.countDocuments();
  if (bookCount === 0) {
    await Book.insertMany(SEED_BOOKS);
    log.info({ count: SEED_BOOKS.length }, 'Seed books created');
  }
}

async function start() {
  await waitForDb();
  await seedData();
  app.listen(config.port, '0.0.0.0', () => {
    log.info({ port: config.port }, 'Backend listening');
  });
}

start().catch((err) => {
  log.error(err, 'Failed to start');
  process.exit(1);
});
