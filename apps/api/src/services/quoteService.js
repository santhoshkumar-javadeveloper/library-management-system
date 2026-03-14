import Quote from '../models/Quote.js';
import { SEED_QUOTES } from '../seeds/seedQuotes.js';

/** Returns one random quote. Seeds the collection if empty (supports 100k+ quotes). */
export async function getRandomQuote() {
  let count = await Quote.countDocuments();
  if (count === 0) {
    await Quote.insertMany(SEED_QUOTES);
    count = SEED_QUOTES.length;
  }
  const result = await Quote.aggregate([{ $sample: { size: 1 } }]);
  const doc = result[0];
  if (doc) {
    return { text: doc.text, author: doc.author || null };
  }
  const fallback = SEED_QUOTES[Math.floor(Math.random() * SEED_QUOTES.length)];
  return { text: fallback.text, author: fallback.author || null };
}
