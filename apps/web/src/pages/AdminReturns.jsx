import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);

  const load = () => {
    setLoading(true);
    api.admin.pendingReturns()
      .then((data) => setReturns(data.returns || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleVerify = async (id) => {
    setVerifying(id);
    setError('');
    try {
      const result = await api.admin.verifyReturn(id);
      setReturns((prev) => prev.filter((r) => r.id !== id));
      if (result.fineAmount > 0) {
        alert(`Return verified. Fine applied: ₹${result.fineAmount}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(null);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Verify returns</h1>
      <p><Link to="/admin" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#64748b', fontSize: 14 }}>User has returned the book. Verify to restore inventory. Late returns may incur a fine.</p>
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
      ) : returns.length === 0 ? (
        <p>No returns pending verification.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {returns.map((r) => (
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
                <span style={{ display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Status: Pending verification</span>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{r.book_title}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{r.book_author}</div>
                <div style={{ fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                  <strong>Returned by</strong>
                  <div style={{ marginTop: 4 }}>{r.user_name} · {r.user_email}{r.user_mobile ? ` · ${r.user_mobile}` : ''}</div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  Returned at: {formatDate(r.returned_at)} · Due was: {formatDate(r.due_date)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleVerify(r.id)}
                disabled={verifying === r.id}
                style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                {verifying === r.id ? 'Verifying...' : 'Verify return'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
