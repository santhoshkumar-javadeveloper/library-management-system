import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function AdminOutOfStock() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    api.admin.outOfStockBooks(params)
      .then((data) => setBooks(data.books || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [search, category]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Out of stock books</h1>
      <p><Link to="/" style={{ color: '#1a1a2e' }}>← Dashboard</Link></p>
      <p style={{ color: '#64748b', fontSize: 14 }}>Books with no available copies. Search by title, author, or category.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search title, author, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', minWidth: 200 }}
        />
        <input
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px 12px', minWidth: 160 }}
        />
      </div>
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : books.length === 0 ? (
        <p>No out-of-stock books found.</p>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderRadius: 8 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Title</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Author</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Category</th>
                <th style={{ textAlign: 'right', padding: 12 }}>Total copies</th>
                <th style={{ textAlign: 'right', padding: 12 }}>Available</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12 }}>{b.title}</td>
                  <td style={{ padding: 12 }}>{b.author}</td>
                  <td style={{ padding: 12 }}>{b.category || b.genre || '—'}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{b.total_copies}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#dc2626' }}>{b.available_copies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
