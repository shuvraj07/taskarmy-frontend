# Taskzity

A two-sided freelance marketplace connecting clients with skilled taskers — built for Nepal's digital economy.

## Overview

Taskzity lets **Clients** post tasks and **Taskers** bid on them, with secure escrow payments, real-time collaboration, and structured file delivery. The platform handles the full lifecycle: task posting → bidding → escrow funding → work delivery → payment release.

## Features

- **Two-sided marketplace** — role-based experiences for Clients and Taskers (RBAC)
- **Google OAuth + JWT authentication** — secure, session-based auth with role selection at onboarding
- **eSewa escrow payments** — funds held in escrow until delivery is approved (IPN-verified flow)
- **Bidding system** — Taskers submit bids; Clients review, compare, and award
- **File exchange portal** — secure uploads/downloads via GCS signed URLs
- **Flexible deliverables** — supports standard files, Docker images, and AI model artifacts (`delivery_type` system)
- **Event-driven backend** — internal event bus for decoupled notifications and workflows

## Tech Stack

**Frontend**
- Next.js 14 (App Router, `src/` structure)
- Zustand (state), TanStack Query (server state)
- React Hook Form + Zod (forms & validation)
- Tailwind CSS

**Backend**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy ORM
- Alembic (migrations)
- JWT auth with role-based access control

**Infrastructure**
- Google Cloud Platform (Cloud Run, Cloud SQL, GCS)
- Docker (multi-stage builds)
- GitHub Actions (CI/CD)
- Vercel (frontend hosting)

## Architecture

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│  Next.js 14 │ ─────▶ │   FastAPI    │ ─────▶ │  PostgreSQL  │
│  (Vercel)   │  REST  │ (Cloud Run)  │        │ (Cloud SQL)  │
└─────────────┘        └──────┬───────┘        └──────────────┘
                              │
                       ┌──────┴───────┐
                       │  GCS (files) │
                       │  eSewa (pay) │
                       └──────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- GCP service account (for GCS signed URLs)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure DB, JWT secret, GCS, eSewa keys
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # configure API URL, Google OAuth client ID
npm run dev
```

App runs at `http://localhost:3000`, API at `http://localhost:8000`.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for signing JWTs |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GCS_BUCKET_NAME` | Bucket for file exchange |
| `ESEWA_MERCHANT_CODE` | eSewa merchant credentials |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (frontend) |

## Deployment

- **Backend:** Dockerized FastAPI deployed to GCP Cloud Run via GitHub Actions CI/CD
- **Frontend:** Next.js on Vercel with automatic preview deployments
- **Migrations:** Alembic runs as part of the deploy pipeline

## Roadmap

- [ ] Real-time chat (WebSockets)
- [ ] Tasker ratings & reviews
- [ ] Khalti payment integration
- [ ] Mobile app

## License

Proprietary — © Current AI Pvt. Ltd. All rights reserved.

---

Built with ❤️ in Nepal by [Current AI](https://currentai.com.np)
