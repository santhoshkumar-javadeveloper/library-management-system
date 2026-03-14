import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const CURRENT_BORROW_STATUSES = ['requested', 'borrowed', 'returned_pending_verify'];
const RETURNED_STATUSES = ['completed', 'returned'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detailsUserId, setDetailsUserId] = useState(null);
  const [historyUserId, setHistoryUserId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadHistory = (userId) => {
    if (historyUserId === userId) {
      setHistoryUserId(null);
      setHistory([]);
      return;
    }
    setHistoryUserId(userId);
    setHistoryLoading(true);
    api.admin.userBorrowHistory(userId)
      .then((data) => setHistory(data.history || []))
      .catch((e) => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  const load = () => {
    setLoading(true);
    api.admin.users(debouncedSearch ? { search: debouncedSearch } : {})
      .then((data) => setUsers(data.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [debouncedSearch]);

  const handleRemoveUser = async (u) => {
    if (u.role === 'super_admin') { setError('Cannot remove a super admin.'); return; }
    if ((u.borrowed_count ?? 0) > 0) {
      setError('Cannot remove: this user has borrowed books not yet returned. Verify returns first.');
      return;
    }
    if (!confirm(`Remove user "${u.name}" (${u.email}) from the platform? This cannot be undone.`)) return;
    setError('');
    setRemovingId(u.id);
    try {
      await api.admin.removeUser(u.id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove user.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Manage Users</h1>
      <p><Link to="/" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#666', fontSize: 14 }}>Search customers by name, email, or mobile. View full details and borrow/return history for each user.</p>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 14px', minWidth: 320, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
      </div>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <>
          <h3>Users ({users.length})</h3>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Mobile</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Role</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Borrowed</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Reservations</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Allowed categories (L2)</th>
                  <th style={{ padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12 }}>{u.name}</td>
                      <td style={{ padding: 12 }}>{u.email}</td>
                      <td style={{ padding: 12 }}>{u.mobile || '—'}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          background: u.role === 'super_admin' ? '#7c3aed' : u.role === 'admin' ? '#059669' : u.role === 'l2_admin' ? '#2563eb' : '#64748b',
                          color: '#fff',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>{u.borrowed_count ?? 0}</td>
                      <td style={{ padding: 12, textAlign: 'right' }}>{u.reservation_count ?? 0}</td>
                      <td style={{ padding: 12 }}>{Array.isArray(u.allowedCategories) && u.allowedCategories.length ? u.allowedCategories.join(', ') : '—'}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDetailsUserId(detailsUserId === u.id ? null : u.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              background: detailsUserId === u.id ? '#1e40af' : '#e0f2fe',
                              color: detailsUserId === u.id ? '#fff' : '#0369a1',
                              border: '1px solid #7dd3fc',
                              borderRadius: 6,
                            }}
                          >
                            {detailsUserId === u.id ? 'Hide details' : 'Details'}
                          </button>
                          <button
                            type="button"
                            onClick={() => loadHistory(u.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              background: historyUserId === u.id ? '#059669' : '#ecfdf5',
                              color: historyUserId === u.id ? '#fff' : '#047857',
                              border: '1px solid #6ee7b7',
                              borderRadius: 6,
                            }}
                          >
                            {historyUserId === u.id ? 'Hide history' : 'History'}
                          </button>
                          {u.role !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(u)}
                              disabled={removingId === u.id || (u.borrowed_count ?? 0) > 0}
                              title={(u.borrowed_count ?? 0) > 0 ? 'User has borrowed books – verify returns first' : 'Remove user from platform'}
                              style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: (u.borrowed_count ?? 0) > 0 ? 'not-allowed' : 'pointer',
                                background: (u.borrowed_count ?? 0) > 0 ? '#f1f5f9' : '#fef2f2',
                                color: (u.borrowed_count ?? 0) > 0 ? '#94a3b8' : '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                              }}
                            >
                              {removingId === u.id ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {detailsUserId === u.id && (
                      <tr key={`${u.id}-details`}>
                        <td colSpan={8} style={{ padding: 16, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            <div><strong>Name</strong><div style={{ color: '#475569' }}>{u.name}</div></div>
                            <div><strong>Email</strong><div style={{ color: '#475569' }}>{u.email}</div></div>
                            <div><strong>Mobile</strong><div style={{ color: '#475569' }}>{u.mobile || '—'}</div></div>
                            <div><strong>Role</strong><div style={{ color: '#475569' }}>{u.role}</div></div>
                            <div><strong>Member since</strong><div style={{ color: '#475569' }}>{u.createdAt ? formatDate(u.createdAt) : '—'}</div></div>
                            <div><strong>Currently borrowed</strong><div style={{ color: '#475569' }}>{u.borrowed_count ?? 0}</div></div>
                            <div><strong>Reservations</strong><div style={{ color: '#475569' }}>{u.reservation_count ?? 0}</div></div>
                            <div><strong>Total borrows (all time)</strong><div style={{ color: '#475569' }}>{u.total_borrows ?? 0}</div></div>
                            {Array.isArray(u.allowedCategories) && u.allowedCategories.length > 0 && (
                              <div style={{ gridColumn: '1 / -1' }}><strong>Allowed categories (L2)</strong><div style={{ color: '#475569' }}>{u.allowedCategories.join(', ')}</div></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {historyUserId === u.id && (
                      <tr key={`${u.id}-history`}>
                        <td colSpan={8} style={{ padding: 16, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {historyLoading ? (
                            <p style={{ margin: 0 }}>Loading...</p>
                          ) : history.length === 0 ? (
                            <p style={{ margin: 0, color: '#64748b' }}>No borrow or return history for this user.</p>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              {(() => {
                                const current = history.filter((h) => CURRENT_BORROW_STATUSES.includes(h.status));
                                const returned = history.filter((h) => RETURNED_STATUSES.includes(h.status));
                                const HistoryTable = ({ list, title }) => (
                                  list.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#334155' }}>{title}</p>
                                      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ textAlign: 'left', padding: 8 }}>Book</th>
                                            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                                            <th style={{ textAlign: 'left', padding: 8 }}>Borrowed</th>
                                            <th style={{ textAlign: 'left', padding: 8 }}>Due</th>
                                            <th style={{ textAlign: 'left', padding: 8 }}>Returned</th>
                                            <th style={{ textAlign: 'right', padding: 8 }}>Fine</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {list.map((h) => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: 8 }}><strong>{h.book_title}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{h.book_author}</div></td>
                                              <td style={{ padding: 8 }}>{h.status}</td>
                                              <td style={{ padding: 8 }}>{formatDate(h.borrowed_at)}</td>
                                              <td style={{ padding: 8 }}>{formatDate(h.due_date)}</td>
                                              <td style={{ padding: 8 }}>{formatDate(h.returned_at || h.verified_at)}</td>
                                              <td style={{ padding: 8, textAlign: 'right' }}>{h.fine_amount > 0 ? `₹${h.fine_amount}` : '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )
                                );
                                return (
                                  <>
                                    <HistoryTable list={current} title="Currently borrowed / pending" />
                                    <HistoryTable list={returned} title="Returned (history)" />
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
