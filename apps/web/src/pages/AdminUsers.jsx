import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.admin.users(search ? { search } : {})
      .then((data) => setUsers(data.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [search]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Manage Users</h1>
      <p><Link to="/admin" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#666', fontSize: 14 }}>View and search users by name, email, or mobile.</p>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users by name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', minWidth: 280 }}
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
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
