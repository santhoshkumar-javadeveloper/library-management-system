import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
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
      await api.auth.register({ name, email, password, mobile: mobile || undefined });
      const { user: userData, token } = await api.auth.login({ email, password });
      login(userData, token);
      navigate('/books');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 30%, #06beb6 60%, #48b1bf 100%)',
      backgroundSize: '400% 400%',
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
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          fontSize: 15,
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontStyle: 'italic' }}>&ldquo;{quote.text}&rdquo;</span>
          {quote.author && <span style={{ display: 'block', fontSize: 13, opacity: 0.9, marginTop: 4 }}>— {quote.author}</span>}
        </div>
      )}

      <div style={{
        maxWidth: 420,
        width: '100%',
        margin: 'auto',
        padding: 36,
        background: 'rgba(255,255,255,0.96)',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Create account
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, marginTop: 8 }}>Join the library and start borrowing</p>
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="Your name" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Password (min 6)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#374151' }}>Mobile (optional)</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} style={inputStyle} placeholder="For library contact" />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(17,153,142,0.45)',
            }}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 15, color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#11998e', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
