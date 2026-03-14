import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const QUOTE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const fetchQuote = () => {
      api.quotes.getRandom().then(setQuote).catch(() => setQuote(null));
    };
    fetchQuote();
    const id = setInterval(fetchQuote, QUOTE_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 20%, #f8fafc 50%)' }}>
      {quote && (
        <div style={{
          padding: '12px 24px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          color: '#fff',
          fontSize: 15,
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
        }}>
          <span style={{ fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</span>
          {quote.author && <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 14, opacity: 0.95 }}>— {quote.author}</span>}
        </div>
      )}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/books" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 16 }}>Books</Link>
          {!['admin', 'super_admin', 'l2_admin'].includes(user?.role) && (
            <Link to="/my-books" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 15 }}>My Books</Link>
          )}
        </nav>
        <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span title={user?.role} style={{ fontSize: 14, color: '#cbd5e1' }}>{user?.email} {user?.role && <span style={{ fontSize: 11, opacity: 0.9 }}>({user.role})</span>}</span>
          <button type="button" onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#e2e8f0', borderRadius: 8, fontWeight: 500 }}>Logout</button>
        </span>
      </header>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
