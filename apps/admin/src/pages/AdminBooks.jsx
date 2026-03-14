import { useState, useEffect, useRef } from 'react';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [authorsList, setAuthorsList] = useState([]);
  const searchWrapperRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const [form, setForm] = useState({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10, isbn: '', description: '', publishedDate: '', originalPrice: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);

  useEffect(() => {
    api.books.getCategories()
      .then((r) => {
        const cats = r.categories || [];
        const genres = r.genres || [];
        const merged = [...cats, ...genres].filter((c, i, a) => a.indexOf(c) === i).sort();
        setCategoriesList(merged.length ? merged : ['Fiction', 'Programming', 'Mystery', 'Non-Fiction', 'Science']);
      })
      .catch(() => setCategoriesList(['Fiction', 'Programming', 'Mystery', 'Non-Fiction', 'Science']));
  }, []);
  useEffect(() => {
    api.books.getAuthors()
      .then((r) => setAuthorsList(r.authors || []))
      .catch(() => setAuthorsList([]));
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }
    const t = setTimeout(() => {
      api.books.suggest(search.trim(), 10)
        .then((res) => {
          setSearchSuggestions(res.suggestions || []);
          setShowSearchSuggestions(true);
        })
        .catch(() => { setSearchSuggestions([]); setShowSearchSuggestions(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) setShowSearchSuggestions(false);
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) setCategoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const load = (page = 1) => {
    setLoading(true);
    setError('');
    const params = { page, limit: 20 };
    if (debouncedSearch.trim().length >= 2) params.search = debouncedSearch.trim();
    if (categoryFilters.length > 0) params.categories = categoryFilters;
    if (authorFilter.trim()) params.author = authorFilter.trim();
    api.books.list(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(1), [debouncedSearch, categoryFilters, authorFilter]);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

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
      setForm({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10, isbn: '', description: '', publishedDate: '', originalPrice: '' });
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
      setForm({ title: '', author: '', category: '', genre: '', totalCopies: 1, thumbnailUrl: '', loanPeriodDays: 10, isbn: '', description: '', publishedDate: '', originalPrice: '' });
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
      isbn: book.isbn || '',
      description: book.description || '',
      publishedDate: book.published_date || '',
      originalPrice: book.original_price != null ? book.original_price : '',
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
        <Link to="/" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      {user?.role === 'l2_admin' && user?.allowedCategories?.length > 0 && (
        <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, marginBottom: 20, border: '1px solid #bfdbfe', fontSize: 14 }}>
          L2 Admin: you can only add, edit, or delete books in these categories: <strong>{user.allowedCategories.join(', ')}</strong>
        </div>
      )}

      <div style={{ marginBottom: 24, padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#334155' }}>Search & filter</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div ref={searchWrapperRef} style={{ flex: '1 1 200px', minWidth: 200, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Search by title, author, category, or ISBN</label>
            <input
              type="text"
              placeholder="e.g. Game of Thrones, Fiction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim().length >= 2 && searchSuggestions.length > 0 && setShowSearchSuggestions(true)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: 280,
                  overflowY: 'auto',
                  zIndex: 50,
                }}
              >
                {searchSuggestions.map((s) => (
                  <li
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => { e.preventDefault(); setSearch(s.title); setShowSearchSuggestions(false); }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <strong>{s.title}</strong>
                    {s.author && <span style={{ color: '#64748b', marginLeft: 8 }}> – {s.author}</span>}
                    {s.category && <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>({s.category})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Filter by author</label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
            >
              <option value="">All authors</option>
              {authorsList.map((a) => (
                <option key={a.name} value={a.name}>{a.name}{a.bookCount > 0 ? ` (${a.bookCount})` : ''}</option>
              ))}
            </select>
          </div>
          <div ref={categoryDropdownRef} style={{ minWidth: 200, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Category</label>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen((o) => !o)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{categoryFilters.length === 0 ? 'Filter by category' : `${categoryFilters.length} selected`}</span>
              <span style={{ color: '#64748b' }}>{categoryDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {categoryDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  padding: 12,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: 260,
                  overflowY: 'auto',
                  zIndex: 50,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Select one or more</span>
                  {categoryFilters.length > 0 && (
                    <button type="button" onClick={() => setCategoryFilters([])} style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  )}
                </div>
                {categoriesList.map((cat) => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={categoryFilters.includes(cat)}
                      onChange={() => setCategoryFilters((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, border: '1px solid #fecaca', fontSize: 14 }}>{error}</div>
      )}
      {successMessage && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', color: '#166534', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14 }}>{successMessage}</div>
      )}

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
              {categoriesList.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                  Suggestions: {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      style={{ marginRight: 6, marginBottom: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: form.category === cat ? '#e0f2fe' : '#f8fafc', cursor: 'pointer', fontSize: 12 }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
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
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>ISBN</label>
              <input placeholder="e.g. 978-0-13-..." value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Published (year/date)</label>
              <input placeholder="e.g. 2020 or Jan 2020" value={form.publishedDate} onChange={(e) => setForm((f) => ({ ...f, publishedDate: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Original price (ref)</label>
              <input type="number" min="0" step="0.01" placeholder="For reference only" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value === '' ? '' : parseFloat(e.target.value) }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Description / About the book</label>
              <textarea rows={3} placeholder="What the book is about..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: '100%', maxWidth: 500, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            </div>
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
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>Global no</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#475569' }}>ISBN</th>
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
                      <td style={{ padding: '14px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: 13 }}>{b.global_number || '—'}</td>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 13 }}>{b.isbn || '—'}</td>
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
