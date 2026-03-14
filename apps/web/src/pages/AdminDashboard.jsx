import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const cardStyle = {
  padding: 24,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  minWidth: 160,
  border: '1px solid #e2e8f0',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [seedMessage, setSeedMessage] = useState('');
  const [seeding, setSeeding] = useState(false);

  const loadStats = () => {
    setError('');
    api.admin.stats()
      .then(setStats)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedBooks = () => {
    setSeeding(true);
    setSeedMessage('');
    api.admin.seedBooks()
      .then((data) => {
        setSeedMessage(data.seeded ? `Added ${data.count} sample books.` : (data.message || 'Books already exist.'));
        if (data.seeded) loadStats();
      })
      .catch((err) => setSeedMessage(err.message || 'Failed to add books'))
      .finally(() => setSeeding(false));
  };

  if (error) {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, color: '#b91c1c' }}>
        <strong>Could not load dashboard.</strong>
        <p style={{ margin: '8px 0 0' }}>{error}</p>
        <button type="button" onClick={loadStats} style={{ marginTop: 12, padding: '8px 16px' }}>Retry</button>
      </div>
    );
  }
  if (!stats) return <div style={{ padding: 24, color: '#64748b' }}>Loading dashboard…</div>;

  const pendingRequests = typeof stats.pendingRequests === 'number' ? stats.pendingRequests : 0;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Overview of your library</p>
      {pendingRequests > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 12 }}>
          <strong>You have {pendingRequests} borrow request{pendingRequests !== 1 ? 's' : ''} waiting for approval.</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Customers who clicked “Request to borrow” are listed in Approve borrows. Open the list and approve when you hand over the book.</p>
          <Link to="/admin/borrow-requests" style={{ display: 'inline-block', marginTop: 12, padding: '10px 18px', background: '#b45309', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>View & approve requests →</Link>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Books</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{stats.totalBooks}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Users</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{stats.totalUsers}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Borrows</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{stats.totalBorrows}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Active Borrows</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{stats.activeBorrows}</div>
        </div>
        {typeof stats.pendingRequests === 'number' && (
          <Link to="/admin/borrow-requests" style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pending approval</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stats.pendingRequests > 0 ? '#b45309' : '#0f172a' }}>{stats.pendingRequests}</div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>Approve borrows →</div>
          </Link>
        )}
        {typeof stats.pendingReturns === 'number' && (
          <Link to="/admin/returns" style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pending verify</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stats.pendingReturns > 0 ? '#b45309' : '#0f172a' }}>{stats.pendingReturns}</div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>Verify returns →</div>
          </Link>
        )}
      </div>
      <div style={{ marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Quick actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Link to="/admin/borrow-requests" style={{ padding: '10px 18px', background: '#b45309', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Approve borrows</Link>
          <Link to="/admin/returns" style={{ padding: '10px 18px', background: '#0d9488', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Verify returns</Link>
          <Link to="/admin/books/out-of-stock" style={{ padding: '10px 18px', background: '#64748b', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Out of stock</Link>
          <button
            type="button"
            onClick={handleSeedBooks}
            disabled={seeding}
            style={{ padding: '10px 18px', cursor: seeding ? 'not-allowed' : 'pointer', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500 }}
          >
            {seeding ? 'Adding…' : 'Add sample books'}
          </button>
          <Link to="/admin/books" style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500, display: 'inline-block' }}>
            Manage Books →
          </Link>
          {stats.totalBooks === 0 && <span style={{ color: '#64748b', fontSize: 14 }}>No books yet. Use “Add sample books” to load 244 sample titles.</span>}
        </div>
        {seedMessage && <p style={{ marginTop: 12, marginBottom: 0, color: '#059669', fontSize: 14 }}>{seedMessage}</p>}
      </div>
    </div>
  );
}
