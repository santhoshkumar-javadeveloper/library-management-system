/**
 * Standalone seed script. Run with: node scripts/seed.js
 * Ensure MONGODB_URI is set (e.g. mongodb://localhost:27017/library).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Book from '../src/models/Book.js';
import { SEED_BOOKS } from '../src/seeds/seedBooks.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';

async function seed() {
  await mongoose.connect(uri);
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@library.com', password: hash, role: 'admin' });
    console.log('Admin user created: admin@library.com / admin123');
  }
  const bookCount = await Book.countDocuments();
  if (bookCount === 0) {
    await Book.insertMany(SEED_BOOKS);
    console.log('Seed books created');
  }
  await mongoose.disconnect();
  console.log('Seed done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
