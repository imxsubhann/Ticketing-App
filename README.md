# Deskline — Support Ticket Portal

A full-stack support/query ticketing system:

- **Backend:** Flask + SQLAlchemy + JWT auth (REST API, SQLite by default)
- **Frontend:** React (Vite) + React Router + Axios
- Users submit queries as tickets and track status (`open` → `in_progress` → `resolved` / `closed`)
- Every ticket has a threaded timeline (replies + automatic status-change entries)
- A separate **admin panel** lists every ticket in the system, with search/filter and controls to change status, priority, and view requester details

```
ticket-portal/
├── backend/     Flask API
└── frontend/    React app
```

## 1. Run the backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env        # edit secrets if you like
python app.py
```

The API starts on **http://localhost:5000**. On first run it auto-creates the
SQLite database and seeds a default admin account:

```
email:    admin@helpdesk.local
password: Admin@123
```

Change this password (or delete/replace the seeded user) before using this in production.

A quick end-to-end smoke test (register → create ticket → admin updates status) is included:

```bash
python smoke_test.py
```

## 2. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # optional, defaults to the Vite dev proxy below
npm run dev
```

Open **http://localhost:5173**. The dev server proxies `/api/*` requests to
`http://localhost:5000`, so no extra configuration is needed locally.

## 3. Using it

- **Sign up** as a normal user, submit a ticket from "New ticket", and watch its
  status update on the ticket detail page as support responds.
- **Sign in as the seeded admin** (or promote a user to `admin` directly in the
  database) to reach `/admin`: a queue of every ticket with stats, search,
  status/priority filters, and per-ticket controls to change status, priority,
  and reply to the requester.

## API overview

| Method | Endpoint                        | Who        | Purpose                              |
|--------|----------------------------------|------------|---------------------------------------|
| POST   | `/api/auth/register`            | public     | Create a user account                |
| POST   | `/api/auth/login`                | public     | Get a JWT                            |
| GET    | `/api/auth/me`                   | user       | Current profile                      |
| POST   | `/api/tickets`                   | user       | Submit a new ticket                  |
| GET    | `/api/tickets`                   | user       | List your own tickets                |
| GET    | `/api/tickets/<id>`              | owner/admin| Ticket detail + timeline             |
| POST   | `/api/tickets/<id>/comments`     | owner/admin| Reply on a ticket                    |
| GET    | `/api/admin/tickets`             | admin      | List/search/filter all tickets       |
| GET    | `/api/admin/tickets/<id>`        | admin      | Ticket detail                        |
| PATCH  | `/api/admin/tickets/<id>`        | admin      | Update status / priority / assignee  |
| GET    | `/api/admin/stats`               | admin      | Counts by status                     |

All authenticated endpoints expect `Authorization: Bearer <token>`.

## Promoting a user to admin

There's no UI for this by design (keeps it safe by default). From a Python shell:

```bash
cd backend
python3 -c "
from app import create_app
from extensions import db
from models import User
app = create_app()
with app.app_context():
    u = User.query.filter_by(email='someone@example.com').first()
    u.role = 'admin'
    db.session.commit()
"
```

## Notes for production

- Swap `SECRET_KEY` / `JWT_SECRET_KEY` for strong random values.
- Point `DATABASE_URL` at Postgres/MySQL instead of SQLite.
- Set `CORS_ORIGINS` to your deployed frontend's origin.
- Build the frontend with `npm run build` (outputs to `frontend/dist`) and serve
  it via any static host or behind the same reverse proxy as the API.
