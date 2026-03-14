import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const DEFAULT_COVER = 'https://placehold.co/200x280/2d3748/e2e8f0?text=Book';

const SORT_OPTIONS = [
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'author_asc', label: 'Author A–Z' },
  { value: 'author_desc', label: 'Author Z–A' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export default function Books() {
  const [data, setData] = useState({ books: [], total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [authorFilter, setAuthorFilter] = useState('');
  const [sort, setSort] = useState('title_asc');
  const [categories, setCategories] = useState({ categories: [], genres: [] });
  const [authors, setAuthors] = useState([]);
  const [suggestedBooks, setSuggestedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [borrowing, setBorrowing] = useState(null);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.books.getCategories()
      .then((res) => { if (!cancelled) setCategories(res); })
      .catch(() => { if (!cancelled) setCategories({ categories: [], genres: [] }); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    api.books.getAuthors()
      .then((res) => {
        if (cancelled) return;
        const raw = res.authors || res || [];
        const list = Array.isArray(raw) ? raw.map((a) => (typeof a === 'string' ? { name: a, bookCount: 0 } : { name: a?.name ?? a?.author ?? '', bookCount: a?.bookCount ?? 0 })) : [];
        setAuthors(list);
      })
      .catch(() => { if (!cancelled) setAuthors([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.books.list({ page: 1, limit: 8, sort: 'newest' })
      .then((res) => { if (!cancelled) setSuggestedBooks(res.books || []); })
      .catch(() => { if (!cancelled) setSuggestedBooks([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    const params = { page, limit: 20, sort };
    if (debouncedSearch.trim().length >= 2) params.search = debouncedSearch.trim();
    if (categoryFilters.length > 0) params.categories = categoryFilters;
    if (authorFilter.trim()) params.author = authorFilter.trim();
    api.books.list(params)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setLoadError(err.message || 'Could not load books'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, debouncedSearch, categoryFilters, authorFilter, sort]);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

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
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleBorrow = async (e, bookId) => {
    e.preventDefault();
    e.stopPropagation();
    setBorrowing(bookId);
    setActionError('');
    try {
      await api.borrow.borrow(bookId);
      setData((prev) => ({
        ...prev,
        books: prev.books.map((b) => b.id === bookId ? { ...b, available_copies: Math.max(0, (b.available_copies ?? 0) - 1) } : b),
      }));
    } catch (err) {
      setActionError(err.message || 'Request failed');
    } finally {
      setBorrowing(null);
    }
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;
  const filterOptions = [
    ...(categories.categories || []),
    ...(categories.genres || []).filter((g) => !(categories.categories || []).includes(g)),
  ];
  const toggleCategory = (c) => {
    setPage(1);
    setCategoryFilters((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  return (
    <div>
      <h1 style={{
        marginTop: 0,
        marginBottom: 8,
        fontSize: 28,
        fontWeight: 800,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Books</h1>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 20 }}>Browse and request books. Use the quote above for inspiration.</p>
      <div style={{
        marginBottom: 20,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: 16,
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: 12,
        border: '1px solid #bae6fd',
      }}>
        <div ref={searchWrapperRef} style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 320, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by title, author, category, genre or ISBN"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onFocus={() => search.trim().length >= 2 && searchSuggestions.length > 0 && setShowSearchSuggestions(true)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                margin: 0,
                marginTop: 4,
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearch(s.title);
                    setShowSearchSuggestions(false);
                    setPage(1);
                  }}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#64748b', marginRight: 4 }}>Categories:</span>
          {filterOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid #cbd5e1',
                background: categoryFilters.includes(c) ? '#1e40af' : '#fff',
                color: categoryFilters.includes(c) ? '#fff' : '#334155',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
          {categoryFilters.length > 0 && (
            <button type="button" onClick={() => { setCategoryFilters([]); setPage(1); }} style={{ padding: '6px 10px', fontSize: 12, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear
            </button>
          )}
        </div>
        <select
          value={authorFilter}
          onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 14,
            minWidth: 180,
            background: '#fff',
          }}
          title="Filter by author (famous authors by book count)"
        >
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}{a.bookCount > 0 ? ` (${a.bookCount})` : ''}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 14,
            minWidth: 160,
            background: '#fff',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {!search.trim() && categoryFilters.length === 0 && suggestedBooks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 16px', color: '#334155' }}>Suggested for you</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {suggestedBooks.map((book) => {
              const available = book.available_copies ?? 0;
              const inStock = available > 0;
              return (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#fff',
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ aspectRatio: '200/280', background: '#f1f5f9' }}>
                    <img
                      src={book.thumbnail_url || DEFAULT_COVER}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => { e.target.src = DEFAULT_COVER; }}
                    />
                  </div>
                  <div style={{ padding: 12 }}>
                    <strong style={{ fontSize: 14, lineHeight: 1.3, display: 'block' }}>{book.title}</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{book.author}</span>
                    <span style={{ display: 'block', fontSize: 11, color: inStock ? '#059669' : '#dc2626', marginTop: 4 }}>
                      {inStock ? 'Available' : 'Out of stock'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {loadError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 16, color: '#b91c1c' }}>
          <strong>Could not load books.</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{loadError}</p>
          {(loadError.includes('fetch') || loadError.includes('Network') || loadError.includes('Failed')) && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>Ensure the backend is running (e.g. at <strong>http://127.0.0.1:3000</strong>) and try again.</p>
          )}
        </div>
      )}
      {actionError && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: 12, marginBottom: 16, color: '#854d0e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} style={{ padding: '4px 10px', fontSize: 13, cursor: 'pointer', border: '1px solid #eab308', borderRadius: 6, background: '#fff' }}>Dismiss</button>
        </div>
      )}
      {loading ? (
        <div style={{ padding: 24, color: '#64748b' }}>Loading books…</div>
      ) : (
        <>
          <p style={{ color: '#64748b', marginBottom: 12, fontSize: 14 }}>
            Showing {data.books.length} of {data.total} books · Page {page} of {totalPages}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {data.books.map((book) => {
              const available = book.available_copies ?? 0;
              const total = book.total_copies ?? 0;
              const inStock = available > 0;
              return (
                <div
                  key={book.id}
                  style={{
                    padding: 0,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Link
                    to={`/books/${book.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}
                  >
                    <div style={{ aspectRatio: '200/280', background: '#f1f5f9', position: 'relative' }}>
                      <img
                        src={book.thumbnail_url || DEFAULT_COVER}
                        alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                        onError={(e) => { e.target.src = DEFAULT_COVER; }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: inStock ? '#059669' : '#dc2626',
                          color: '#fff',
                        }}
                      >
                        {inStock ? `In stock (${available})` : 'Out of stock'}
                      </span>
                    </div>
                    <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <strong style={{ fontSize: 15, lineHeight: 1.3 }}>{book.title}</strong>
                      <span style={{ color: '#64748b', fontSize: 14 }}>{book.author}</span>
                      {(book.category || book.genre) && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {[book.category, book.genre].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                        Availability: {available} of {total} copies
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: '0 14px 14px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleBorrow(e, book.id)}
                      disabled={!inStock || borrowing === book.id}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        cursor: !inStock || borrowing === book.id ? 'not-allowed' : 'pointer',
                        background: inStock ? '#1e40af' : '#cbd5e1',
                        color: inStock ? '#fff' : '#64748b',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 500,
                      }}
                    >
                      {borrowing === book.id ? 'Requesting…' : inStock ? 'Request to borrow' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {data.books.length === 0 && !loadError && (
            <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>
              <p style={{ fontSize: 18, margin: 0 }}>No books found.</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>Try a different search or category, or ask an admin to add sample books from the Admin portal.</p>
            </div>
          )}
          <div style={{
            marginTop: 24,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: page <= 1 ? '#f1f5f9' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: page >= totalPages ? '#f1f5f9' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
