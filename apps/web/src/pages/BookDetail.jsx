import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

const DEFAULT_COVER = 'https://placehold.co/200x280/2d3748/e2e8f0?text=Book';
const EXTRA_COPY_REASONS = ['Lost the book', 'Need for extended reference', 'Teaching / Education', 'Research', 'Other'];

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [sameGenre, setSameGenre] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [requested, setRequested] = useState(false);
  const [extraCopyReason, setExtraCopyReason] = useState('');
  const [extraCopyReasonCustom, setExtraCopyReasonCustom] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setSameGenre([]);
    setLoading(true);
    setError('');
    api.books.get(id)
      .then((b) => { if (!cancelled) setBook(b); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.borrow.myBooks()
      .then((list) => { if (!cancelled) setMyBooks(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setMyBooks([]); });
    return () => { cancelled = true; };
  }, [id]);
  useEffect(() => {
    if (!id || !book) return;
    let cancelled = false;
    api.books.getSameGenre(id, 6)
      .then((res) => { if (!cancelled) setSameGenre(res.books || []); })
      .catch(() => { if (!cancelled) setSameGenre([]); });
    return () => { cancelled = true; };
  }, [id, book]);

  const handleRequestBorrow = async (opts = {}) => {
    if (!book) return;
    setBorrowing(true);
    setError('');
    try {
      await api.borrow.borrow(book.id, opts);
      setRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    if (!book) return;
    setReserving(true);
    setError('');
    try {
      await api.borrow.reserve(book.id);
      setBook((b) => ({ ...b, reserved: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: '#64748b' }}>Loading book…</div>;
  if (error && !book) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <Link to="/books" style={{ color: '#1e40af', textDecoration: 'underline' }}>Back to Books</Link>
      </div>
    );
  }
  if (!book) return null;

  const hasBorrowedThisBook = Array.isArray(myBooks) && myBooks.some((m) => String(m.book_id) === String(book.id));
  const available = book.available_copies ?? 0;
  const total = book.total_copies ?? 0;
  const inStock = available > 0;

  return (
    <div>
      <Link to="/books" style={{ display: 'inline-block', marginBottom: 16, color: '#1e40af', textDecoration: 'none', fontSize: 14 }}>← Back to Books</Link>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 280px) 1fr',
        gap: 32,
        alignItems: 'start',
        marginBottom: 40,
      }}
      >
        <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <img
            src={book.thumbnail_url || DEFAULT_COVER}
            alt={book.title}
            style={{ width: '100%', aspectRatio: '200/280', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.src = DEFAULT_COVER; }}
          />
        </div>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, lineHeight: 1.2 }}>{book.title}</h1>
          <p style={{ margin: '0 0 4px', fontSize: 18, color: '#64748b' }}>{book.author}</p>
          {book.global_number && (
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
              Code: {book.global_number}
            </p>
          )}
          {book.isbn && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
              ISBN: {book.isbn}
            </p>
          )}
          {(book.category || book.genre) && (
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#94a3b8' }}>
              {[book.category, book.genre].filter(Boolean).join(' · ')}
            </p>
          )}
          {book.published_date && (
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#64748b' }}>
              Published: {book.published_date}
            </p>
          )}
          {(book.original_price != null && book.original_price !== '') && (
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>
              Reference price: ₹{Number(book.original_price).toLocaleString('en-IN')} (not for sale – for reference only)
            </p>
          )}
          {book.description && (
            <div style={{ marginBottom: 20, padding: '12px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#334155' }}>About this book</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#475569', whiteSpace: 'pre-wrap' }}>{book.description}</p>
            </div>
          )}
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            background: inStock ? '#059669' : '#dc2626',
            color: '#fff',
            marginBottom: 20,
          }}
          >
            {inStock ? `In stock (${available} of ${total} copies)` : 'Out of stock'}
          </div>
          {error && <p style={{ color: '#b91c1c', marginBottom: 12, fontSize: 14 }}>{error}</p>}
          {requested && (
            <p style={{ color: '#059669', marginBottom: 12, fontSize: 14 }}>
              Request submitted. Visit the library with your email or mobile; the admin will approve and hand over the book.
            </p>
          )}
          {inStock && !requested && hasBorrowedThisBook && (
            <div style={{ marginBottom: 16, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>You already have one copy of this book. To request an additional copy, please select a reason:</p>
              <select
                value={extraCopyReason}
                onChange={(e) => setExtraCopyReason(e.target.value)}
                style={{ width: '100%', maxWidth: 320, padding: 10, marginBottom: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}
              >
                <option value="">Select a reason</option>
                {EXTRA_COPY_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {extraCopyReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify your reason"
                  value={extraCopyReasonCustom}
                  onChange={(e) => setExtraCopyReasonCustom(e.target.value)}
                  style={{ width: '100%', maxWidth: 320, padding: 10, marginBottom: 8, borderRadius: 6, border: '1px solid #e2e8f0', display: 'block' }}
                />
              )}
              <button
                type="button"
                onClick={() => handleRequestBorrow({
                  extraCopyReason: extraCopyReason.trim(),
                  ...(extraCopyReason === 'Other' && { extraCopyReasonCustom: extraCopyReasonCustom.trim() }),
                })}
                disabled={borrowing || !extraCopyReason.trim() || (extraCopyReason === 'Other' && !extraCopyReasonCustom.trim())}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: borrowing ? 'not-allowed' : 'pointer',
                  background: '#1e40af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                }}
              >
                {borrowing ? 'Submitting...' : 'Submit additional copy request'}
              </button>
            </div>
          )}
          {inStock && !requested && !hasBorrowedThisBook && (
            <button
              type="button"
              onClick={() => handleRequestBorrow()}
              disabled={borrowing}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 500,
                cursor: borrowing ? 'not-allowed' : 'pointer',
                background: '#1e40af',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                marginRight: 8,
              }}
            >
              {borrowing ? 'Submitting...' : 'Request to borrow'}
            </button>
          )}
          {!inStock && (
            <button
              type="button"
              onClick={handleReserve}
              disabled={reserving || book.reserved}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 500,
                cursor: reserving || book.reserved ? 'not-allowed' : 'pointer',
                background: book.reserved ? '#94a3b8' : '#64748b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
              }}
            >
              {reserving ? 'Reserving...' : book.reserved ? 'Reserved' : 'Reserve (show at library to collect)'}
            </button>
          )}
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
            {inStock ? 'Admin must approve your request at the library. Return within ' + (book.loan_period_days ?? 10) + ' days.' : 'Reserve from home; show your email/mobile at the library so admin can approve and give you the book.'}
          </p>
        </div>
      </div>

      {sameGenre.length > 0 && (
        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: 32 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, color: '#334155' }}>
            More in {book.category || book.genre || 'this genre'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
            {sameGenre.map((b) => {
              const avail = b.available_copies ?? 0;
              return (
                <Link
                  key={b.id}
                  to={`/books/${b.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#fff',
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ aspectRatio: '200/280', background: '#f1f5f9' }}>
                    <img
                      src={b.thumbnail_url || DEFAULT_COVER}
                      alt={b.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => { e.target.src = DEFAULT_COVER; }}
                    />
                  </div>
                  <div style={{ padding: 12 }}>
                    <strong style={{ fontSize: 14, lineHeight: 1.3, display: 'block' }}>{b.title}</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{b.author}</span>
                    <span style={{ display: 'block', fontSize: 11, color: avail > 0 ? '#059669' : '#dc2626', marginTop: 4 }}>
                      {avail > 0 ? 'Available' : 'Out of stock'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
