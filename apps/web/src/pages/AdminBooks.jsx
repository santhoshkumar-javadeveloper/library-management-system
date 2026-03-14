import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const DEFAULT_COVER = 'https://placehold.co/200x280/2d3748/e2e8f0?text=Book';

export default function AdminBooks() {
  const { user } = useAuth();
  const [data, setData] = useState({ books: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10 });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const load = (page = 1) => {
    setLoading(true);
    setError('');
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    api.books.list(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(1), [search, categoryFilter]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.books.create(form);
      setForm({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10 });
      setAddFormOpen(false);
      showSuccess('Book added successfully.');
      load(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    setSubmitting(true);
    try {
      await api.books.update(editingId, {
        ...form,
        availableCopies: form.availableCopies ?? data.books.find((b) => b.id === editingId)?.available_copies,
        loanPeriodDays: form.loanPeriodDays ?? 10,
      });
      setEditingId(null);
      setForm({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10 });
      showSuccess('Book updated successfully.');
      load(data.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, totalCopies, availableCopies) => {
    const borrowed = (totalCopies ?? 0) - (availableCopies ?? 0);
    if (borrowed > 0) {
      setError('Cannot delete: some copies are currently borrowed. Wait for returns and verify them first.');
      return;
    }
    if (!confirm('Delete this book? This cannot be undone.')) return;
    setError('');
    try {
      await api.books.delete(id);
      showSuccess('Book deleted.');
      load(data.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setAddFormOpen(false);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category || '',
      genre: book.genre || '',
      totalCopies: book.total_copies,
      availableCopies: book.available_copies,
      thumbnailUrl: book.thumbnail_url || '',
      loanPeriodDays: book.loan_period_days ?? 10,
    });
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;
  const hasBorrowedCopies = (b) => ((b.total_copies ?? 0) - (b.available_copies ?? 0)) > 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Manage Books</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>{data.total} books in catalog</p>
        </div>
        <Link to="/admin" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      {user?.role === 'l2_admin' && user?.allowedCategories?.length > 0 && (
        <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, marginBottom: 20, border: '1px solid #bfdbfe', fontSize: 14 }}>
          L2 Admin: you can only add, edit, or delete books in these categories: <strong>{user.allowedCategories.join(', ')}</strong>
        </div>
      )}

      {/* Search & filter */}
      <div style={{ marginBottom: 24, padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#334155' }}>Search & filter</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Search by title, author, or category</label>
            <input
              type="text"
              placeholder="e.g. Game of Thrones, Fiction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Category</label>
            <input
              type="text"
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, border: '1px solid #fecaca', fontSize: 14 }}>{error}</div>
      )}
      {successMessage && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', color: '#166534', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14 }}>{successMessage}</div>
      )}

      {/* Add / Edit book */}
      <div style={{ marginBottom: 28, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: addFormOpen || editingId ? 20 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>{editingId ? 'Edit book' : 'Add new book'}</h3>
          {!editingId && (
            <button type="button" onClick={() => { setAddFormOpen((o) => !o); setError(''); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
              {addFormOpen ? 'Cancel' : '+ Add book'}
            </button>
          )}
        </div>
        {(addFormOpen || editingId) && (
          <form onSubmit={editingId ? handleUpdate : handleAdd} style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', maxWidth: 900, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Title *</label>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Author *</label>
              <input placeholder="Author" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Category</label>
              <input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Genre</label>
              <input placeholder="Genre" value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total copies</label>
              <input type="number" min="1" value={form.totalCopies} onChange={(e) => setForm((f) => ({ ...f, totalCopies: parseInt(e.target.value, 10) || 1 }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Loan (days)</label>
              <input type="number" min="1" max="3650" value={form.loanPeriodDays ?? 10} onChange={(e) => setForm((f) => ({ ...f, loanPeriodDays: parseInt(e.target.value, 10) || 10 }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} title="Loan period in days" />
            </div>
            {editingId && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Available (in stock)</label>
                <input type="number" min="0" value={form.availableCopies ?? ''} onChange={(e) => setForm((f) => ({ ...f, availableCopies: parseInt(e.target.value, 10) }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Thumbnail URL</label>
              <input placeholder="https://..." value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} style={{ width: '100%', maxWidth: 400, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={submitting} style={{ padding: '10px 20px', background: editingId ? '#0f172a' : '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? (editingId ? 'Saving…' : 'Adding…') : (editingId ? 'Update book' : 'Add book')}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10 }); }} style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Book list */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>Total: {data.total} books · Page {data.page} of {totalPages}</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading books…</div>
        ) : data.books.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>No books match your search or filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Cover</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Author</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Genre</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Total copies</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Available</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.books.map((b) => {
                  const inStock = (b.available_copies ?? 0) > 0;
                  const borrowed = hasBorrowedCopies(b);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 12 }}>
                        <img src={b.thumbnail_url || DEFAULT_COVER} alt="" style={{ width: 44, height: 62, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.target.src = DEFAULT_COVER; }} />
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 500 }}>{b.title}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{b.author}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{b.category || '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>{b.genre || '—'}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>{b.total_copies}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{ color: inStock ? '#059669' : '#dc2626', fontWeight: 500 }}>
                          {b.available_copies} {inStock ? '(in stock)' : '(out of stock)'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button type="button" onClick={() => startEdit(b)} style={{ marginRight: 8, padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Edit</button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.total_copies, b.available_copies)}
                          disabled={borrowed}
                          title={borrowed ? 'Cannot delete: some copies are currently borrowed.' : 'Delete this book'}
                          style={{
                            padding: '6px 12px',
                            fontSize: 13,
                            borderRadius: 6,
                            border: '1px solid #fecaca',
                            background: borrowed ? '#f1f5f9' : '#fff',
                            color: borrowed ? '#94a3b8' : '#dc2626',
                            cursor: borrowed ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.books.length > 0 && (
          <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            <button type="button" disabled={data.page <= 1} onClick={() => load(data.page - 1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: data.page <= 1 ? 'not-allowed' : 'pointer', opacity: data.page <= 1 ? 0.6 : 1 }}>Previous</button>
            <span style={{ color: '#64748b', fontSize: 14 }}>Page {data.page} of {totalPages}</span>
            <button type="button" disabled={data.page >= totalPages} onClick={() => load(data.page + 1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: data.page >= totalPages ? 'not-allowed' : 'pointer', opacity: data.page >= totalPages ? 0.6 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
