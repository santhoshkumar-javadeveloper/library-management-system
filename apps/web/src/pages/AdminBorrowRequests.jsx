import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function AdminBorrowRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(null);
  const [overrideCopy, setOverrideCopy] = useState({});

  const load = () => {
    setLoading(true);
    api.admin.borrowRequests()
      .then((data) => setRequests(data.requests || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleApprove = async (id, overrideCopyLimit = false) => {
    setApproving(id);
    setError('');
    try {
      await api.admin.approveBorrow(id, overrideCopyLimit);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Approve borrow requests</h1>
      <p><Link to="/admin" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#64748b', fontSize: 14 }}>When a customer clicks “Request to borrow” on a book, they appear here. Approve when you hand over the book at the library. If they reserved from home, it is shown below.</p>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={() => load()} disabled={loading} style={{ padding: '8px 14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Loading…' : 'Refresh list'}
        </button>
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 16, color: '#b91c1c' }}>
          <strong>Error</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{error}</p>
          {error.includes('Session expired') && (
            <a href="/login" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: '#1e40af', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>Log in again</a>
          )}
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No pending borrow requests. New requests appear here when customers use “Request to borrow” on a book (not the old one-click Borrow).</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flex: '1 1 280px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Status: Pending approval</span>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{r.book_title}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{r.book_author}{r.book_category ? ` · ${r.book_category}` : ''}</div>
                <div style={{ fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#0f172a' }}>Requested by</strong>
                  <div style={{ marginTop: 4 }}>{r.user_name} · {r.user_email}{r.user_mobile ? ` · ${r.user_mobile}` : ''}</div>
                </div>
                {r.reserved_from_home && (
                  <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                    Reserved from home — customer will show this at library
                  </span>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  Requested at: {r.requested_at ? new Date(r.requested_at).toLocaleString() : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user?.role === 'super_admin' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={overrideCopy[r.id] || false}
                      onChange={(e) => setOverrideCopy((o) => ({ ...o, [r.id]: e.target.checked }))}
                    />
                    Override 2-copy limit
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => handleApprove(r.id, overrideCopy[r.id])}
                  disabled={approving === r.id}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  {approving === r.id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
