import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const cardStyle = (accent) => ({
  padding: 24,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  minWidth: 160,
  border: `1px solid ${accent ? `${accent}30` : '#e2e8f0'}`,
  borderLeft: accent ? `4px solid ${accent}` : undefined,
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [seedMessage, setSeedMessage] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState('');
  const [backfilling, setBackfilling] = useState(false);

  const loadStats = () => {
    setError('');
    api.admin.stats()
      .then(setStats)
      .catch((err) => setError(err.message));
  };

  useEffect(() => loadStats(), []);

  const handleBackfillIsbn = () => {
    setBackfillMessage('');
    setBackfilling(true);
    api.admin.backfillIsbn()
      .then((data) => {
        setBackfillMessage(data.message || `Assigned ISBN to ${data.updated ?? 0} book(s).`);
        if (data.updated > 0) loadStats();
      })
      .catch((err) => setBackfillMessage(err.message || 'Backfill failed'))
      .finally(() => setBackfilling(false));
  };

  const handleSeedBooks = () => {
    setSeeding(true);
    setSeedMessage('');
    api.admin.seedBooks()
      .then((data) => {
        if (data.seeded) {
          setSeedMessage(`Added ${data.count} sample books.`);
          loadStats();
        } else {
          setSeedMessage(data.message || 'Books already exist.');
          navigate('/books');
        }
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
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>Overview of your library</p>
      {pendingRequests > 0 && (
        <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #f59e0b', borderRadius: 12, boxShadow: '0 2px 8px rgba(245,158,11,0.15)' }}>
          <strong>You have {pendingRequests} borrow request{pendingRequests !== 1 ? 's' : ''} waiting for approval.</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Customers who clicked “Request to borrow” are listed in Approve borrows. Open the list and approve when you hand over the book.</p>
          <Link to="/borrow-requests" style={{ display: 'inline-block', marginTop: 12, padding: '10px 18px', background: '#b45309', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>View & approve requests →</Link>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={cardStyle('#3b82f6')}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Books</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>{stats.totalBooks}</div>
        </div>
        <div style={cardStyle('#059669')}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Users</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#047857' }}>{stats.totalUsers}</div>
        </div>
        <div style={cardStyle('#7c3aed')}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Total Borrows</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#6d28d9' }}>{stats.totalBorrows}</div>
        </div>
        <div style={cardStyle('#0ea5e9')}>
          <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Active Borrows</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0284c7' }}>{stats.activeBorrows}</div>
        </div>
        {typeof stats.pendingRequests === 'number' && (
          <Link to="/borrow-requests" style={{ ...cardStyle('#d97706'), textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pending approval</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stats.pendingRequests > 0 ? '#b45309' : '#0f172a' }}>{stats.pendingRequests}</div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>Approve borrows →</div>
          </Link>
        )}
        {typeof stats.pendingReturns === 'number' && (
          <Link to="/returns" style={{ ...cardStyle('#0891b2'), textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>To return</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stats.pendingReturns > 0 ? '#0e7490' : '#0f172a' }}>{stats.pendingReturns}</div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>Mark returns →</div>
          </Link>
        )}
      </div>
      <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: '#334155' }}>Quick actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Link to="/borrow-requests" style={{ padding: '10px 18px', background: 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500, boxShadow: '0 2px 4px rgba(234,88,12,0.3)' }}>Approve borrows</Link>
          <Link to="/returns" style={{ padding: '10px 18px', background: 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Mark returns</Link>
          <Link to="/books/out-of-stock" style={{ padding: '10px 18px', background: '#475569', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Out of stock</Link>
          <button
            type="button"
            onClick={handleSeedBooks}
            disabled={seeding}
            style={{ padding: '10px 18px', cursor: seeding ? 'not-allowed' : 'pointer', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500 }}
          >
            {seeding ? 'Adding…' : 'Add sample books'}
          </button>
          <Link to="/books" style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 500, display: 'inline-block' }}>
            Manage Books →
          </Link>
          <button
            type="button"
            onClick={handleBackfillIsbn}
            disabled={backfilling}
            style={{ padding: '10px 18px', cursor: backfilling ? 'not-allowed' : 'pointer', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500 }}
            title="Assign ISBN and global number to all books missing either"
          >
            {backfilling ? 'Backfilling…' : 'Backfill ISBN & global no.'}
          </button>
          {stats.totalBooks === 0 && <span style={{ color: '#64748b', fontSize: 14 }}>No books yet. Use “Add sample books” to load 244 sample titles.</span>}
        </div>
        {seedMessage && <p style={{ marginTop: 12, marginBottom: 0, color: '#059669', fontSize: 14 }}>{seedMessage}</p>}
        {backfillMessage && <p style={{ marginTop: 12, marginBottom: 0, color: '#059669', fontSize: 14 }}>{backfillMessage}</p>}
      </div>
    </div>
  );
}
