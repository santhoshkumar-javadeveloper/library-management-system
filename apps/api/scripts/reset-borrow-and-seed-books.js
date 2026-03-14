/**
 * Reset all borrow/return data and replace books with 1000+ fresh seed books.
 * Run from repo root: docker compose exec backend node scripts/reset-borrow-and-seed-books.js
 * Or locally: cd apps/api && node scripts/reset-borrow-and-seed-books.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import BorrowRecord from '../src/models/BorrowRecord.js';
import Reservation from '../src/models/Reservation.js';
import Book from '../src/models/Book.js';
import { getExpandedSeedBooks } from '../src/seeds/seedBooks.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';
const MIN_BOOKS = 1000;

async function reset() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const borrowDeleted = await BorrowRecord.deleteMany({});
  console.log('Deleted borrow records:', borrowDeleted.deletedCount);

  const reservationDeleted = await Reservation.deleteMany({});
  console.log('Deleted reservations:', reservationDeleted.deletedCount);

  const booksDeleted = await Book.deleteMany({});
  console.log('Deleted books:', booksDeleted.deletedCount);

  const newBooks = getExpandedSeedBooks(MIN_BOOKS);
  await Book.insertMany(newBooks);
  console.log('Inserted fresh books:', newBooks.length);

  await mongoose.disconnect();
  console.log('Reset done. Borrow/return data cleared;', newBooks.length, 'books in catalog.');
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
