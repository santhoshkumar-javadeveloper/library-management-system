# Library Management System — Hackathon (Observability)

A simple Library Management System built for the Kombee FE & BE Hackathon, with **observability** using Prometheus, Loki, Tempo, and Grafana.

## Demo video

**[Watch demo video](https://www.awesomescreenshot.com/video/50432215?key=e187791d9b4375973cc23b1b21a376c2)**

## Features

- **Auth:** Register, Login, JWT
- **Books:** List (pagination, search), Add, Update, Delete
- **Borrow:** Borrow book, Return book, My borrowed books
- **Observability:** Metrics (Prometheus), Logs (Loki via Promtail), Traces (Tempo via OpenTelemetry)

## Quick Start

```bash
docker-compose up -d
```

- **Customer app (main site):** http://localhost:5174 (or http://127.0.0.1:5174) — Books, My Books, Register, Login  
- **Admin portal (separate app):** http://localhost:5175 (or http://127.0.0.1:5175) — Dashboard, Approve borrows, Verify returns, Manage Books, Out of stock, Users  
- **Backend API:** http://localhost:3000 (or http://127.0.0.1:3000)  
- **Grafana:** http://localhost:3001 (admin / admin)  
- **Prometheus:** http://localhost:9090  

The **admin portal is a separate frontend** (different port/domain). This keeps the customer app lighter and lets you deploy admin on a different domain (e.g. `admin.yourlibrary.com`) in production. Both apps use the same backend API.

**Login as user:** Use the **customer app** (port 5174). Register in the UI; browse books, request borrows, and manage My Books.

**Admin login:** Use the **admin portal** (port 5175). Only admin/super_admin/l2_admin roles can log in there.

**Roles (stored in DB):**
- **user** — Customer; borrow/return books (customer app only).
- **l2_admin** — Can manage books only in **allowed categories** (admin portal).
- **admin** — Full admin: dashboard, manage books, view users (admin portal).
- **super_admin** — Can create admin/L2 admin/users via **Users** in the admin portal.

**Seeded accounts (created on first backend start):**
- **Super Admin:** **superadmin@library.com** / **super123** — log in at **http://localhost:5175**
- **Admin:** **admin@library.com** / **admin123** — log in at **http://localhost:5175**

**Project structure:** See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for folder and file layout.

**Where does the frontend get its data?**  
All data (books, users, borrows) comes **only from the database**. The frontend has no local or mock data: it calls the backend API, and the backend reads/writes MongoDB. So if the database is empty, the Books page will show "No books found" and the dashboard will show zeros.

**Seeding the database:**
- **On backend start:** If the DB is empty, the backend automatically creates the super admin, admin user, and **all seed books** (244 titles) when it starts. So after `docker-compose up -d`, wait for the backend to be healthy; the books should appear.
- **From Admin UI:** Open the **admin portal** at http://localhost:5175, log in as **admin@library.com** / **admin123**, go to **Dashboard**, and click **"Add sample books"**. This only adds books if the collection is currently empty.
- **From command line (Docker):** If the backend started before the DB was ready and no books were seeded, run:  
  `docker compose exec backend node scripts/seed.js`  
  (Uses the same MongoDB as the app; creates admin users if missing and inserts seed books if the collection is empty.)

**Database:** The project uses **MongoDB**. When using Docker, the app stores all data in the **same** MongoDB you can reach from your machine.

**How to see the data in the database:**

1. **Connection**
   - **MongoDB Compass:** New connection → `mongodb://localhost:27018` → Connect (app's MongoDB is on port **27018** to avoid conflict with local MongoDB on 27017).
   - **mongosh (CLI):** `mongosh "mongodb://localhost:27018"`.

2. **Database and collections**
   - The app uses the database named **`library`** (not `admin`, `config`, or `local`). In Compass, in the left sidebar under your connection, click the **`library`** database. Then open the **`books`** and **`users`** collections.
   - If you see **Log** (and no **library**): you're connected to your local MongoDB on 27017. The app's MongoDB runs in Docker on port **27018**. In Compass, connect to **`mongodb://localhost:27018`** to see the **library** database with `books` and `users`. See [COMPASS_CONNECTION.md](COMPASS_CONNECTION.md).

3. **If you see no data**
   - Ensure Docker is running and the stack is up: `docker compose ps` (database and backend should be Up).
   - Seed the database (adds admin users and 244 books if the collection is empty):
     ```bash
     docker compose exec backend node scripts/seed.js
     ```
   - In Compass, refresh the `library` database and open the `books` collection.

**Fresh start (remove all borrow/return data, replace books with 1000+):**  
From project root, run (uses MongoDB on port 27018; ensure backend container or MongoDB is running):
  ```bash
  cd apps/api && MONGODB_URI=mongodb://127.0.0.1:27018/library node scripts/reset-borrow-and-seed-books.js
  ```
  On Windows PowerShell: `cd apps/api; $env:MONGODB_URI="mongodb://127.0.0.1:27018/library"; node scripts/reset-borrow-and-seed-books.js`  
  This deletes all borrow records and reservations, deletes all books, then inserts 1000 fresh seed books. Users are kept.

## Development — avoid full rebuilds

- **Do not delete images** — use `docker-compose up -d --build` when you need a rebuild. Docker reuses cached layers; images are only removed if you run `docker-compose down --rmi all` or `build --no-cache`.
- **Backend code changes without rebuild:** use the dev override so backend source is mounted; the container restarts automatically when you save files:
  ```bash
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
  ```
  Edit files in `apps/api/src/`; the backend restarts automatically (node --watch). No image rebuild needed.
- **Frontend changes:** run the frontend locally for quick iteration: `cd apps/web && npm run dev` (and set `VITE_API_URL=http://127.0.0.1:3000`). Or rebuild only the frontend when needed: `docker-compose up -d --build frontend` (backend and database images stay cached).

## Troubleshooting — Application not working

**Why "API unreachable" / "Backend is unreachable" appears**

The frontend (browser at port 5174) calls the backend at **http://127.0.0.1:3000**. If that request fails, you see this message. Common causes:

- **Backend not running or still starting** — After `docker compose up`, wait 20–30 seconds for the backend to start and connect to MongoDB. Then refresh the page or click **Retry** (Login page and red banner both have Retry).
- **Backend crashed** — Run `docker compose logs backend --tail 50` to see errors. Restart with `docker compose restart backend`.
- **Port 3000 in use or blocked** — Another app may be using port 3000, or Windows Firewall may block it. In the browser, open **http://127.0.0.1:3000/health** directly; if you see `{"status":"ok"}`, the backend is reachable and you can click **Retry** in the app.

**1. Restart the stack (keeps images; uses cache)**

```bash
cd library-management-system
docker-compose up -d --build
```

Wait ~30 seconds for the database and backend to be ready. Do **not** run `docker-compose down --rmi all` unless you want to remove images and do a full rebuild from scratch.

**2. Check the API from your browser**

Open:

- http://127.0.0.1:3000/health — should show `{"status":"ok"}`
- http://127.0.0.1:3000/books — should show a JSON list of books

If these don’t load or time out:

- Confirm Docker Desktop is running and the containers are up: `docker ps` (backend, frontend, database should be “Up”).
- Try **localhost** instead of **127.0.0.1** (or the other way around) in the browser.
- Temporarily allow the app through Windows Firewall for private networks if needed.

**3. Open the app**

- Use **http://127.0.0.1:5174** (or http://localhost:5174).
- If the page loads but books don’t appear or login fails, the browser cannot reach the API. Ensure the `/health` and `/books` URLs above work in the same browser.

**4. If the frontend was built with a different API URL**

The frontend is built with `VITE_API_URL=http://127.0.0.1:3000`. To point it to another host/port, set that build arg in `docker-compose.yml` under `frontend.build.args`, then rebuild:

```bash
docker-compose up -d --build frontend
```

**5. Backend or DB errors**

- Backend logs: `docker logs library-management-system-backend-1`
- Database healthy: `docker ps` should show `(healthy)` for the database (MongoDB) container. To inspect data in Compass: connect to `mongodb://localhost:27018`, then open database `library` (see [COMPASS_CONNECTION.md](COMPASS_CONNECTION.md)).

**6. Backend keeps exiting (Mongoose / MongoDB driver error)**

If you see `MongoDBResponse.make is not a function` or backend status **Exited (1)**:

- The stack uses **MongoDB 6** and **Mongoose 7** for compatibility. Rebuild and restart the backend:
  ```powershell
  cd library-management-system
  .\scripts\restart-backend.ps1
  ```
  Or manually: `docker-compose build backend` then `docker-compose up -d database backend`. Wait ~20 seconds and check http://127.0.0.1:3000/health.

## Logs and errors — where to look

### 1. Docker container logs (PowerShell or CMD)

From the project folder (`library-management-system`):

| What you want | Command |
|----------------|---------|
| **Backend (API) logs** | `docker logs library-management-system-backend-1` |
| Backend, last 50 lines | `docker logs library-management-system-backend-1 --tail 50` |
| Backend, follow live | `docker logs library-management-system-backend-1 -f` |
| Frontend (nginx) logs | `docker logs library-management-system-frontend-1` |
| Database logs | `docker logs library-management-system-database-1` |
| All backend errors (grep) | `docker logs library-management-system-backend-1 2>&1 \| findstr -i error` |

Backend logs are **JSON** (e.g. `"level":"error"`, `"msg":"..."`, `"event":"login_failure"`). Use `--tail` and `-f` to avoid huge output.

### 2. Browser (frontend errors)

- Open the app: **http://127.0.0.1:5174**
- Press **F12** (or right‑click → Inspect) to open Developer Tools.
- Go to the **Console** tab — JavaScript errors and failed API calls show here.
- Go to the **Network** tab — see each request to the API; red = failed, click a request to see status and response.

### 3. Grafana (centralized logs)

If Loki and Promtail are running:

- Open **http://127.0.0.1:3001** and log in (admin / admin).
- Go to **Explore** (compass icon), choose **Loki**.
- Query examples:
  - `{service="backend"}` — all backend logs
  - `{service="backend"} \| json \| level="error"` — errors only
  - `{service="backend"} \| json \| event="login_failure"` — login failures

Use the **Logs** dashboard (provisioned) for error logs, login failures, and validation errors.

### 4. Quick checklist

| Symptom | Where to check |
|--------|-----------------|
| API returns 500 / errors | `docker logs library-management-system-backend-1 --tail 100` |
| Login/register fails | Browser Console (F12); backend logs for `event="login_failure"` or `validation_error` |
| Books don’t load | Browser Network tab (F12); backend logs |
| Container won’t start | `docker logs library-management-system-backend-1` (or the failing container) |
| DB connection errors | `docker logs library-management-system-backend-1`; ensure `library-management-system-database-1` is Up and healthy |

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://database:27017/library (Docker) or mongodb://localhost:27017/library (local) |
| `JWT_SECRET` | Secret for JWT | (set in compose) |
| `INJECT_ANOMALIES` | Enable demo anomalies (delay + random 500 on borrow, inefficient search) | false |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Tempo OTLP endpoint | http://tempo:4318 |

## Anomaly Demo

Set `INJECT_ANOMALIES=true` for the backend (e.g. in `docker-compose.yml` under `backend.environment`) and restart:

- **Borrow:** 2s artificial delay; ~10% of borrow requests return 500.
- **Book search:** When searching, the backend does a full table scan (no index use) so search is slower.

Then run the load test and watch Grafana (Application Health, Logs, Tempo) to see impact.

## Load Testing (k6)

Install [k6](https://k6.io/docs/getting-started/installation/), then:

```bash
# Default: BASE_URL=http://localhost:3000
k6 run k6-tests/load-test.js

# Or with more VUs / duration
k6 run --vus 50 --duration 5m k6-tests/load-test.js
```

The script includes:

- Browsing books (GET /books) with pagination and search
- Borrow flow (login, GET /books, POST /borrow, GET /my-books)
- A spike phase (ramp to 50 VUs)

Register a user `loadtest@example.com` / `password123` once, or let the script register it in `setup()`.

## Project structure

See **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** for the full layout. Summary:

- **apps/web/** — React app: pages (Login, Register, Books, My Books, Admin Dashboard, Manage Books), API client, auth context.
- **apps/api/** — Express API: routes (auth, books, borrow, admin), services, middleware, config, observability (logs, metrics, tracing).
- **infra/** — Prometheus, Loki, Promtail, Tempo, Grafana configs and dashboards.
- **docker-compose.yml** — database, backend, frontend, observability services.
- **scripts/restart-backend.ps1** — Rebuild and restart backend.
- **k6-tests/** — Load test script.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | No | Register |
| POST | /login | No | Login (returns JWT) |
| GET | /books | No | List books (query: page, limit, search) |
| GET | /books/:id | No | Get book |
| POST | /books | Yes | Create book |
| PUT | /books/:id | Yes | Update book |
| DELETE | /books/:id | Yes | Delete book |
| POST | /borrow | Yes | Borrow (body: bookId, 24-char MongoDB id string) |
| POST | /return | Yes | Return (body: recordId or bookId, 24-char MongoDB id strings) |
| GET | /my-books | Yes | My borrowed books |
| GET | /metrics | No | Prometheus metrics |
| GET | /admin/stats | Yes (admin or super_admin) | Dashboard stats (books, users, borrows) |
| GET | /admin/users | Yes (admin or super_admin) | List all users (stored in DB) |
| POST | /admin/users | Yes (super_admin only) | Create user (role: user, l2_admin, admin; L2: allowedCategories) |

## Grafana Dashboards

- **Application Health:** Requests per minute, error rate, p95 latency, borrow operations.
- **Database Performance:** Book/API latency and error rate (proxy for DB).
- **Logs:** Error logs, login failures, validation errors, book_borrowed / book_returned events.

Trace-to-logs correlation is configured in the Tempo datasource (trace ID → Loki).

## Notes

- **Windows (Docker Desktop):** The Promtail service mounts `/var/lib/docker/containers` to ship container logs to Loki. On Windows this path may not exist; you can comment out that volume in `docker-compose.yml` or run Promtail only on Linux. The app and other observability tools still work.
- **Tempo:** The app runs and exports traces; if the Tempo container fails to start (e.g. config/Kafka requirements in newer images), metrics and logs still work. Use Grafana for Prometheus and Loki; traces will appear once Tempo is running.

## Verified (E2E)

- `docker-compose up -d` brings up database, backend, frontend, Prometheus, Loki, Promtail, Grafana.
- **API:** GET `/books` returns seeded books; POST `/register` and POST `/login` work; POST `/borrow` with JWT and GET `/my-books` work.
- **Frontend:** http://localhost:5174 — register, login, browse books, borrow, my-books, return.
- **Metrics:** http://localhost:3000/metrics exposes Prometheus metrics; Grafana (http://localhost:3001) can use the provisioned Prometheus datasource and dashboards.
- **Logs:** Backend logs (JSON with traceId, event) are shipped to Loki via Promtail when the Docker log volume is available.

## Local Development (without Docker)

1. **MongoDB** running locally (e.g. port 27017). Set `MONGODB_URI=mongodb://localhost:27017/library` (or leave default).
2. **Backend:**  
   `cd apps/api && npm install && npm run dev`  
   (Optional: run seed script to seed admin + books if the DB is empty.)
3. **Frontend:**  
   `cd apps/web && npm install && npm run dev`  
   Use the Vite proxy (default) so `/api` goes to the backend.

Optionally run Prometheus, Loki, Tempo, and Grafana via Docker for observability.
