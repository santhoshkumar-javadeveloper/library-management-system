import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const DEFAULT_COVER = 'https://placehold.co/200x280/2d3748/e2e8f0?text=Book';

export default function MyReservations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.borrow.myReservations()
      .then(setList)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    setError('');
    try {
      await api.borrow.cancelReservation(id);
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>My Reservations</h1>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        Show your email or mobile number at the library so the admin can see you reserved this book from home and approve your borrow.
      </p>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : list.length === 0 ? (
        <p>You have no reservations. Reserve a book from the <Link to="/books">Books</Link> page when it is out of stock.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {list.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 12,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                gap: 12,
              }}
            >
              <img
                src={r.thumbnail_url || DEFAULT_COVER}
                alt=""
                style={{ width: 64, height: 96, objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { e.target.src = DEFAULT_COVER; }}
              />
              <div style={{ flex: 1 }}>
                <strong>{r.book_title}</strong>
                <div style={{ fontSize: 13, color: '#64748b' }}>{r.author}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Reserved {new Date(r.created_at).toLocaleDateString()}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Link to={`/books/${r.book_id}`} style={{ fontSize: 13, color: '#1e40af' }}>View book</Link>
                  <button
                    type="button"
                    onClick={() => handleCancel(r.id)}
                    disabled={cancelling === r.id}
                    style={{ fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {cancelling === r.id ? 'Cancelling...' : 'Cancel reservation'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
