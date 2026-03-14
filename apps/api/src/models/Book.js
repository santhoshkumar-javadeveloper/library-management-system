import mongoose from 'mongoose';

function generateGlobalNumber() {
  const base = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * (36 * 36))
    .toString(36)
    .toUpperCase()
    .padStart(2, '0');
  return `BK-${base}${rand}`;
}

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, default: null },
    genre: { type: String, default: null },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    thumbnailUrl: { type: String, default: null },
    /** Loan period in days (e.g. 10, 30, 365). Default 10. */
    loanPeriodDays: { type: Number, default: 10 },
    /** Unique global number/code for this book (accession number). */
    globalNumber: { type: String, required: true, unique: true, default: generateGlobalNumber },
    /** International Standard Book Number (unique per edition). */
    isbn: { type: String, default: null },
    /** Short or long description / summary of the book. */
    description: { type: String, default: null },
    /** When the book was published (year or full date string). */
    publishedDate: { type: String, default: null },
    /** Original/list price for reference (library not for sale). */
    originalPrice: { type: Number, default: null },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', category: 'text', genre: 'text' });
bookSchema.index({ globalNumber: 1 }, { unique: true });
bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ author: 1 });

export default mongoose.model('Book', bookSchema);
