import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';

const APP_URL = import.meta.env.VITE_APP_URL || '';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/borrow-requests', label: 'Approve borrows' },
    { to: '/returns', label: 'Verify returns' },
    { to: '/books', label: 'Manage Books' },
    { to: '/books/out-of-stock', label: 'Out of stock' },
    ...(user?.role === 'admin' || user?.role === 'super_admin' ? [{ to: '/users', label: 'Users' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 0px)', background: '#f8fafc' }}>
      <aside
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: '#e2e8f0',
          padding: '24px 0',
          flexShrink: 0,
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 4 }}>
            Admin Portal
          </div>
          {APP_URL ? (
            <a
              href={APP_URL}
              style={{
                color: '#38bdf8',
                textDecoration: 'none',
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Back to Library
            </a>
          ) : null}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(({ to, label }) => {
            const isActive = (to === '/' && path === '/') || (to !== '/' && path.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '12px 20px',
                  color: isActive ? '#fff' : '#94a3b8',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '20px 20px 0', marginTop: 'auto', fontSize: 12, color: '#64748b' }}>
          <div>{user?.email}</div>
          <div style={{ color: '#94a3b8' }}>{user?.role}</div>
          <button type="button" onClick={handleLogout} style={{ marginTop: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: 4 }}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
