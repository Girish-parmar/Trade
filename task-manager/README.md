# Task Manager

A standalone task management application with projects, a drag-and-drop Kanban
board, quick task entry with smart date shortcuts, reusable task-group
templates, collaboration (assignment + comments), and due-date notifications.

This app is fully isolated from the rest of this repository (the TradePro AI
trading platform in `../backend` and `../frontend`) — separate stack, database,
auth, and Docker services.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, dnd-kit

## Project structure

```
task-manager/
  backend/    Express API (see backend/src/modules for feature modules)
  frontend/   React SPA (see frontend/src/pages and components)
  docker-compose.yml
```

## Local development (without Docker)

1. Start PostgreSQL and create a database (or use the `postgres` service from
   `docker-compose.yml`: `docker compose up -d postgres`).
2. Backend:
   ```bash
   cd backend
   cp .env.example .env   # edit DATABASE_URL / JWT secrets as needed
   npm install
   npm run prisma:migrate
   npm run dev             # http://localhost:4000
   ```
3. Frontend (in a second terminal):
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev              # http://localhost:5173
   ```

Or from the `task-manager/` root, after `npm install` (workspaces install both
apps): `npm run dev` runs both concurrently.

## Full stack via Docker

```bash
docker compose up --build
```

This starts Postgres (`5433`), the backend API (`4001`), and the frontend
(`4173`), all on an isolated `task-manager-network` so it can run alongside
the trading app's own `docker-compose.yml` without port collisions.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. The backend validates
required variables at boot and fails fast if any are missing.

## Tests

```bash
# Backend (Jest + Supertest against a dedicated Postgres test database)
cd backend
DATABASE_URL=postgresql://taskmanager:taskmanager@localhost:5432/taskmanager_test npm test

# Frontend (Vitest + Testing Library)
cd frontend
npm test
```

## Seeding demo data

```bash
cd backend
npm run prisma:seed
```

Creates two users (`alice@example.com` / `bob@example.com`, password
`password123`) and a demo project with one task.

## Key features

- **Auth**: JWT access token + rotating httpOnly-cookie refresh token.
- **Projects & members**: role-based access (OWNER/ADMIN/MEMBER) per project.
- **Kanban board**: drag-and-drop between To Do / In Progress / Done, backed
  by a fractional-position ordering scheme so reordering is a single-row
  update.
- **Quick-add**: single-input task creation with one-click date shortcuts
  (Today / Tomorrow / Next Week).
- **Templates**: define a named group of tasks once, then instantiate the
  whole set (with offset due dates) in one click.
- **Collaboration**: assign tasks, comment on them, get notified on
  assignment, comments, and due-soon/overdue tasks (via a scheduled scan job).
