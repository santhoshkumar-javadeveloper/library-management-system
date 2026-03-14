import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function AdminReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);
  const [otpByRecord, setOtpByRecord] = useState({});
  const [failedRecordId, setFailedRecordId] = useState(null);
  const [verifyByEmailOrMobile, setVerifyByEmailOrMobile] = useState('');
  const [specialCase, setSpecialCase] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const load = () => {
    setLoading(true);
    setError('');
    setFailedRecordId(null);
    api.admin.pendingReturns()
      .then((data) => {
        const list = data && (Array.isArray(data.returns) ? data.returns : Array.isArray(data) ? data : []);
        setReturns(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        setError(e?.message || 'Could not load returns. Check that the API is running and you are logged in.');
        setReturns([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (id, opts = {}) => {
    if (!id) return;
    setVerifying(id);
    setError('');
    setFailedRecordId(null);
    const otp = opts.otp ?? otpByRecord[id];
    const body = {};
    if (opts.specialCase) body.specialCase = true;
    else if (opts.verifyByEmailOrMobile) body.verifyByEmailOrMobile = String(opts.verifyByEmailOrMobile).trim();
    else if (otp != null && String(otp).trim() !== '') body.otp = String(otp).trim();
    try {
      const result = await api.admin.verifyReturn(id, body);
      if (result && result.success !== false) {
        setReturns((prev) => prev.filter((r) => r.id !== id));
        setOtpByRecord((prev) => ({ ...prev, [id]: '' }));
        if (result.fineAmount > 0) {
          alert(`Return verified. Fine applied: ₹${result.fineAmount}`);
        }
      } else {
        setError(result?.error || 'Verification failed');
        if (isSuperAdmin) setFailedRecordId(id);
      }
    } catch (err) {
      setError(err.message || 'Request failed');
      if (isSuperAdmin) setFailedRecordId(id);
    } finally {
      setVerifying(null);
    }
  };

  const handleGenerateOtp = async (id) => {
    if (!id) return;
    setGeneratingOtp(id);
    setError('');
    try {
      const result = await api.admin.generateReturnOtp(id);
      alert(`New Return OTP for this book: ${result.returnOtp}\n\nTell the customer to refresh their "My Books" page to see this OTP, or share it with them.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingOtp(null);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Mark returns</h1>
      <p><Link to="/" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        When a customer brings a book back, ask them for the <strong>Return OTP</strong> shown in their portal (My Books). Enter it below and click Verify. Only the admin at the library should mark returns.
      </p>
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
        <p>No books currently borrowed. When you approve a borrow, the book appears here until you verify return with the customer&apos;s OTP.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {returns.map((r, idx) => (
            <div
              key={r?.id ?? idx}
              style={{
                padding: 16,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: '1 1 280px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>With customer</span>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{r.book_title ?? 'Unknown book'}</div>
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{r.book_author ?? ''}</div>
                  <div style={{ fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                    <strong>Borrowed by</strong>
                    <div style={{ marginTop: 4 }}>{r.user_name ?? 'Unknown'} · {r.user_email ?? ''}{r.user_mobile ? ` · ${r.user_mobile}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    Borrowed: {formatDate(r.borrowed_at)} · Due: {formatDate(r.due_date)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit OTP from customer"
                    value={otpByRecord[r?.id] ?? ''}
                    onChange={(e) => setOtpByRecord((prev) => ({ ...prev, [r?.id]: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    style={{ width: 160, padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 16, letterSpacing: 2 }}
                    maxLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerify(r?.id)}
                    disabled={verifying === r?.id}
                    style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                  >
                    {verifying === r?.id ? 'Verifying…' : 'Verify return'}
                  </button>
                </div>
              </div>
              {failedRecordId === r?.id && isSuperAdmin && (
                <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>Super admin options (OTP issue)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleGenerateOtp(r?.id)}
                      disabled={generatingOtp === r?.id}
                      style={{ padding: '6px 12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                      {generatingOtp === r?.id ? 'Generating…' : 'Generate new OTP'}
                    </button>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Verify by customer email or mobile:</span>
                    <input
                      type="text"
                      placeholder="Email or mobile"
                      value={verifyByEmailOrMobile}
                      onChange={(e) => setVerifyByEmailOrMobile(e.target.value)}
                      style={{ width: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleVerify(r.id, { verifyByEmailOrMobile })}
                      disabled={verifying === r.id || !verifyByEmailOrMobile.trim()}
                      style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                      Verify by email/mobile
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={specialCase} onChange={(e) => setSpecialCase(e.target.checked)} />
                      Special case: return anyway
                    </label>
                    {specialCase && (
                      <button
                        type="button"
                        onClick={() => handleVerify(r?.id, { specialCase: true })}
                        disabled={verifying === r?.id}
                        style={{ padding: '6px 12px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        {verifying === r?.id ? 'Processing…' : 'Return (special case)'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
