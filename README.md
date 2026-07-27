# SiteGuard — PPE Compliance Monitoring System

A full-stack web application that lets Administrators and Site Supervisors manage
workforce operations and monitor PPE (Personal Protective Equipment) compliance,
built for the Full Stack Developer technical assessment.

**Stack:** React + TypeScript (frontend) · Node.js + Express + TypeScript (backend) ·
MongoDB + Mongoose (database) · JWT authentication.

---

## 1. Project structure

```
ppe-monitoring-system/
├── backend/                 # Node/Express/TypeScript API
│   └── src/
│       ├── config/          # DB connection
│       ├── models/          # User, Worker, Violation (Mongoose schemas)
│       ├── middleware/      # auth (JWT), role guard, error handler
│       ├── controllers/     # route handlers
│       ├── routes/          # Express routers
│       ├── services/        # IoT violation simulator + auto-escalation
│       ├── seed/            # dataset import + demo data seed script
│       ├── app.ts / server.ts
├── frontend/                 # React + TypeScript (Vite) SPA
│   └── src/
│       ├── api/              # axios client with JWT interceptor
│       ├── context/          # AuthContext
│       ├── routes/           # role-based ProtectedRoute
│       ├── components/       # AppShell (nav), shared UI
│       ├── pages/admin/      # Dashboard, Users, Alerts, Data Insights
│       └── pages/supervisor/ # Dashboard, Violations, Reports
├── docs/
│   ├── DATABASE_SCHEMA.md
│   └── API_DOCUMENTATION.md
└── workers_raw.json           # raw export of the provided dataset (reference)
```

---

## 2. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`) **or** a connection string
  to MongoDB Atlas.

---

## 3. Backend setup

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # imports the 100-worker dataset + creates demo accounts
npm run dev                 # starts the API on http://localhost:5000
```

`npm run seed` will:

- Import all 100 workers from the provided dataset.
- Create a default **Admin** account: `admin@ppesite.com` / `Admin@12345`
- Create a default **Supervisor** account: `supervisor@ppesite.com` / `Supervisor@12345`
- Generate ~60 demo violations across the last 3 days so dashboards/charts aren't empty.

Once running, the API also starts two background loops (see `src/services/simulator.ts`):

- Every `SIMULATION_INTERVAL_SECONDS` (default 45s), a **new simulated IoT violation**
  is created for a random active worker — this is how the assessment's requirement to
  "simulate alerts and non-compliance" is satisfied continuously while the server runs.
- Every 30s, any `open` violation older than `ALERT_ESCALATION_MINUTES` (default 10)
  is automatically flipped to `escalated` and appears on the Admin's **Alerts** page.

You can also trigger a violation on demand from either portal via `POST /api/violations/simulate`.

### Production build

```bash
npm run build
npm start
```

---

## 4. Frontend setup

```bash
cd frontend
cp .env.example .env       # VITE_API_URL, defaults to http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:5173
```

### Production build

```bash
npm run build      # outputs to frontend/dist
npm run preview    # serve the production build locally
```

---

## 5. Login

Open `http://localhost:5173`, and sign in with either seeded account:

| Role       | Email                  | Password         |
| ---------- | ---------------------- | ---------------- |
| Admin      | admin@ppesite.com      | Admin@12345      |
| Supervisor | supervisor@ppesite.com | Supervisor@12345 |

Each role only sees and can access its own module set (enforced both by frontend
route guards and backend middleware — see `middleware/role.ts`).

---

## 6. Feature walkthrough

### Authentication

JWT-based login for Admin and Supervisor. Tokens are stored client-side and attached
to every API call; expired/invalid tokens redirect back to `/login`.

### Administrator portal

- **Dashboard** — headcount, escalated alerts, open violations, compliance rate.
- **Users** — create, disable/enable, and remove Supervisor accounts.
- **Alerts** — violations unacknowledged by a supervisor for 10+ minutes.
- **Data Insights** — charts: 14-day violation trend, by department, by PPE type,
  by status, by severity (via Recharts).

### Supervisor portal

- **Dashboard** — today's violations, pending acknowledgements, average response time.
- **Violations** — live list of site non-compliance events with an **Acknowledge**
  button; filterable by status.
- **Reports** — export the violations list to CSV with status/department/date filters.

### Alert workflow (as specified)

1. A worker's IoT device is simulated flagging non-compliance → a `violation` (status
   `open`) is created.
2. It appears on the Supervisor's **Violations** page with an Acknowledge button.
3. If not acknowledged within 10 minutes, a background job flips it to `escalated`
   and it appears on the Administrator's **Alerts** page.
4. Acknowledging a violation (from either state) marks it resolved and records who
   acknowledged it and when.

---

## 7. Environment variables (backend `.env`)

| Variable                                   | Default                                    | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ |
| `PORT`                                     | `5000`                                     | API port                                                     |
| `MONGO_URI`                                | `mongodb://localhost:27017/ppe_monitoring` | Mongo connection string                                      |
| `JWT_SECRET`                               | —                                          | Set a strong random value                                    |
| `JWT_EXPIRES_IN`                           | `8h`                                       | Token lifetime                                               |
| `CLIENT_ORIGIN`                            | `http://localhost:5173`                    | CORS allow-origin                                            |
| `ALERT_ESCALATION_MINUTES`                 | `10`                                       | Window before an open violation escalates                    |
| `SIMULATION_INTERVAL_SECONDS`              | `45`                                       | Interval for the demo IoT violation generator (`0` disables) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | see `.env.example`                         | Credentials created by `npm run seed`                        |

---

## 8. Deployment notes

- **Backend**: deployable to Render / Railway / Fly.io / any Node host. Set the env
  vars above; point `MONGO_URI` at MongoDB Atlas.
- **Frontend**: deployable to Vercel / Netlify. Set `VITE_API_URL` to the deployed
  backend's `/api` URL, and set the backend's `CLIENT_ORIGIN` to the deployed
  frontend URL for CORS.

---

## 9. Further documentation

- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — collections, fields, relationships, status lifecycle.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — every endpoint, params, and sample payloads.
