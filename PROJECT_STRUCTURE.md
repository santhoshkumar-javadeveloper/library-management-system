# Library Management System — Project Structure

World-standard layered structure: **routes → controllers → services → models**, with **config** for app and DB settings.

## Root

```
library-management-system/
├── apps/
│   ├── web/                    # React (Vite) — customer app (Books, My Books, Login, Register)
│   ├── admin/                  # React (Vite) — admin portal only (separate UI/domain)
│   └── api/                    # Node.js + Express API (see below)
├── infra/                      # Docker & observability
│   ├── prometheus/
│   ├── loki/
│   ├── promtail/
│   ├── tempo/
│   ├── grafana/
│   └── dashboards/
├── scripts/
│   └── restart-backend.ps1
├── k6-tests/
├── docker-compose.yml
├── docker-compose.dev.yml
├── README.md
├── PROJECT_STRUCTURE.md
├── COMPASS_CONNECTION.md
```

**Note:** If an old `backend/` folder still exists at root (from before the restructure), you can delete it; the app lives under `apps/api/`.

---

## Backend (`apps/api/`) — Layered structure

```
apps/api/
├── src/
│   ├── config/                 # App & DB configuration
│   │   ├── index.js             # Port, JWT, env
│   │   ├── otel.js              # OpenTelemetry
│   │   └── database.js          # MongoDB connection (Mongoose)
│   ├── models/                 # Data models (Mongoose schemas)
│   │   ├── User.js
│   │   ├── Book.js
│   │   └── BorrowRecord.js
│   ├── controllers/           # Request handlers (HTTP in/out)
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── borrowController.js
│   │   └── adminController.js
│   ├── services/               # Business logic
│   │   ├── authService.js
│   │   ├── bookService.js
│   │   └── borrowService.js
│   ├── routes/                 # Route definitions → controllers
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── borrow.js
│   │   └── admin.js
│   ├── middleware/             # Auth, error, tracing, etc.
│   ├── observability/          # Logger, metrics, tracing
│   ├── seeds/                  # Seed data (seedBooks.js)
│   ├── app.js                  # Express app, mounts routes
│   └── server.js               # Start server, DB connect, seed
├── scripts/
│   └── seed.js                 # Standalone seed script
├── package.json
└── Dockerfile
```

### Flow

- **Routes** — Define HTTP method + path, validation, middleware; call **controllers**.
- **Controllers** — Parse request, call **services**, send response (status + JSON).
- **Services** — Business logic; use **models** and **config/database** for DB access.
- **Models** — Mongoose schemas (User, Book, BorrowRecord).
- **Database** — Connection only (`database/connection.js`).

---

## Customer app (`apps/web/`)

Customer-facing site only: Books, My Books, Login, Register. No admin UI (admin uses a separate app).

| Path | Purpose |
|------|--------|
| `src/App.jsx` | Routes (books, my-books, login, register) |
| `src/main.jsx` | Entry, Router, AuthProvider |
| `src/api/client.js` | API client |
| `src/components/` | Layout (header with Books, My Books) |
| `src/pages/` | Login, Register, Books, BookDetail, MyBooks |
| `src/context/` | AuthContext |

## Admin portal (`apps/admin/`)

Separate frontend for library staff. Can be deployed on a different domain (e.g. admin.library.com). Same API as customer app.

| Path | Purpose |
|------|--------|
| `src/App.jsx` | Admin-only routes (/, /borrow-requests, /returns, /books, /users) |
| `src/components/AdminLayout.jsx` | Sidebar nav, “Back to Library” link (VITE_APP_URL) |
| `src/pages/` | Login (admin-only), AdminDashboard, AdminBorrowRequests, AdminReturns, AdminBooks, AdminUsers, AdminOutOfStock |
| `src/api/client.js` | API client (auth, admin.*, books CRUD) |

Build args: `VITE_API_URL` (backend), `VITE_APP_URL` (customer app URL for “Back to Library” link).

---

## Infra (`infra/`)

Prometheus, Loki, Promtail, Tempo, Grafana configs and dashboards.

---

## Scripts, data & roles

- **scripts/restart-backend.ps1** — Rebuild and restart backend (run from project root).
- **Database:** MongoDB, port 27018, database `library`. See COMPASS_CONNECTION.md.
- **Roles:** user, l2_admin, admin, super_admin. Seeded: superadmin@library.com / super123, admin@library.com / admin123.
