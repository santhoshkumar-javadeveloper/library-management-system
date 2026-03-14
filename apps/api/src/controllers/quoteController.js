import * as quoteService from '../services/quoteService.js';

export async function getRandom(req, res, next) {
  try {
    const quote = await quoteService.getRandomQuote();
    res.json(quote);
  } catch (err) {
    next(err);
  }
}
