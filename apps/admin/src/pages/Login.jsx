import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const ADMIN_ROLES = ['admin', 'super_admin', 'l2_admin'];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.quotes.getRandom().then(setQuote).catch(() => setQuote(null));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: userData, token } = await api.auth.login({ email, password });
      if (!ADMIN_ROLES.includes(userData?.role)) {
        setError('Access denied. This portal is for library staff only.');
        setLoading(false);
        return;
      }
      login(userData, token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message?.replace(/^Failed to fetch\.?/i, 'Unable to connect. Please try again.') || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #334155 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>

      {quote && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 24px',
          background: 'rgba(15,23,42,0.9)',
          color: '#e2e8f0',
          fontSize: 15,
          textAlign: 'center',
          borderBottom: '1px solid rgba(148,163,184,0.3)',
        }}>
          <span style={{ fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</span>
          {quote.author && <span style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginTop: 4 }}>— {quote.author}</span>}
        </div>
      )}

      <div style={{
        maxWidth: 400,
        width: '100%',
        padding: 36,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        boxShadow: '0 25px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            color: '#0f172a',
          }}>
            Admin portal
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Library staff only. Use your admin account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              color: '#b91c1c',
              fontSize: 14,
            }}>{error}</div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(30,64,175,0.4)',
            }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
