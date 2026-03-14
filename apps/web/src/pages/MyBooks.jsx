import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const DEFAULT_COVER = 'https://placehold.co/200x280/2d3748/e2e8f0?text=Book';

const STATUS_LABELS = {
  requested: 'Pending approval',
  borrowed: 'Borrowed (return at library)',
  returned_pending_verify: 'Awaiting verification at library',
  completed: 'Returned',
  returned: 'Returned',
};

const CURRENT_STATUSES = ['requested', 'borrowed', 'returned_pending_verify'];
const HISTORY_STATUSES = ['completed', 'returned'];

export default function MyBooks() {
  const [list, setList] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [dueAlerts, setDueAlerts] = useState({ dueSoon: [], overdue: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.borrow.myBooks(), api.borrow.myReservations()])
      .then(([borrows, resList]) => {
        setList(borrows);
        setReservations(Array.isArray(resList) ? resList : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  useEffect(() => {
    api.borrow.dueAlerts()
      .then((data) => setDueAlerts({ dueSoon: data.dueSoon || [], overdue: data.overdue || [] }))
      .catch(() => setDueAlerts({ dueSoon: [], overdue: [] }));
  }, [list]);

  const handleCancelReservation = async (id) => {
    setCancelling(id);
    setError('');
    try {
      await api.borrow.cancelReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const isOverdue = (r) => r.status === 'borrowed' && r.due_date && new Date(r.due_date) < new Date();
  const isDueSoon = (r) =>
    r.status === 'borrowed' &&
    r.due_date &&
    (() => {
      const d = new Date(r.due_date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return d.toDateString() === today.toDateString() || d.toDateString() === tomorrow.toDateString();
    })();

  return (
    <div>
      <h1 style={{
        marginTop: 0,
        marginBottom: 8,
        fontSize: 28,
        fontWeight: 800,
        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>My Books</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
        Your borrow requests, borrowed books, and reservations. Return books at the library — staff will mark them returned.
      </p>
      {dueAlerts.overdue.length > 0 && (
        <div style={{ padding: 12, marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
          <strong>Overdue:</strong> Please return: {dueAlerts.overdue.map((r) => r.title).join(', ')}. Fine may apply.
        </div>
      )}
      {dueAlerts.dueSoon.length > 0 && dueAlerts.overdue.length === 0 && (
        <div style={{ padding: 12, marginBottom: 16, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8 }}>
          <strong>Due soon (tomorrow or today):</strong> {dueAlerts.dueSoon.map((r) => r.title).join(', ')}. Return to avoid fines.
        </div>
      )}
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : list.length === 0 && reservations.length === 0 ? (
        <p>You have no borrow requests, borrowed books, or reservations. Browse <Link to="/books">Books</Link> to request or reserve.</p>
      ) : (
        <>
          {list.filter((r) => CURRENT_STATUSES.includes(r.status)).length > 0 && (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 12, marginTop: 24 }}>Current borrows & requests</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {list.filter((r) => CURRENT_STATUSES.includes(r.status)).map((record) => (
                  <div
                    key={record.id}
                    style={{
                      padding: 0,
                      background: '#fff',
                      borderRadius: 10,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      gap: 14,
                      borderLeft: isOverdue(record) ? '4px solid #dc2626' : isDueSoon(record) ? '4px solid #eab308' : undefined,
                    }}
                  >
                    <img
                      src={record.thumbnail_url || DEFAULT_COVER}
                      alt=""
                      style={{ width: 80, height: 112, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.src = DEFAULT_COVER; }}
                    />
                    <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{record.title}</strong>
                        <div style={{ color: '#64748b', fontSize: 14 }}>{record.author}</div>
                        {record.category && <span style={{ fontSize: 12, color: '#94a3b8' }}>{record.category}</span>}
                        <div style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
                          {STATUS_LABELS[record.status] || record.status}
                        </div>
                        {record.borrow_date && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>Borrowed: {formatDate(record.borrow_date)}</div>
                        )}
                        {record.due_date && record.status === 'borrowed' && (
                          <div style={{ fontSize: 12, color: isOverdue(record) ? '#dc2626' : '#64748b' }}>
                            Due: {formatDate(record.due_date)}{isOverdue(record) && ' (overdue)'}
                          </div>
                        )}
                        {record.fine_amount > 0 && (
                          <div style={{ fontSize: 12, color: '#b91c1c' }}>Fine: ₹{record.fine_amount}</div>
                        )}
                      </div>
                      {record.status === 'borrowed' && (
                        <>
                          {record.return_otp ? (
                            <div style={{ marginTop: 8, padding: 10, background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>Return OTP – share this when you return the book</div>
                              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, fontFamily: 'monospace', color: '#1e3a8a' }}>{record.return_otp}</div>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>Give this code to the staff at the library so they can mark the book returned.</p>
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Return this book at the library. Staff will mark it returned.</p>
                          )}
                        </>
                      )}
                      {record.status === 'returned_pending_verify' && (
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Awaiting verification at library.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {list.filter((r) => HISTORY_STATUSES.includes(r.status)).length > 0 && (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 12, marginTop: list.filter((r) => CURRENT_STATUSES.includes(r.status)).length > 0 ? 28 : 24 }}>History (borrowed & returned)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {list.filter((r) => HISTORY_STATUSES.includes(r.status)).map((record) => (
                  <div
                    key={record.id}
                    style={{
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    <img
                      src={record.thumbnail_url || DEFAULT_COVER}
                      alt=""
                      style={{ width: 56, height: 80, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.src = DEFAULT_COVER; }}
                    />
                    <div style={{ flex: 1, fontSize: 14 }}>
                      <strong>{record.title}</strong>
                      <div style={{ color: '#64748b' }}>{record.author}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                        Borrowed: {formatDate(record.borrow_date)}
                      </div>
                      <div style={{ fontSize: 12, color: '#059669' }}>
                        Returned: {formatDate(record.verified_at || record.return_date)}
                      </div>
                      {record.fine_amount > 0 && (
                        <div style={{ fontSize: 12, color: '#b91c1c' }}>Fine: ₹{record.fine_amount}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {reservations.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 12, marginTop: list.length > 0 ? 28 : 0 }}>Reservations</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                Show your email or mobile at the library so the admin can see you reserved from home and approve your borrow.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {reservations.map((r) => (
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
                        Reserved {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link to={`/books/${r.book_id}`} style={{ fontSize: 13, color: '#1e40af' }}>View book</Link>
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(r.id)}
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
            </>
          )}
        </>
      )}
    </div>
  );
}
