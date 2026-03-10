# NexaBase — Production-Ready AI SaaS Starter

> **Next.js 14 (App Router) · FastAPI · LangChain · Supabase · Stripe · OpenAI**

**[Live Demo](https://nexabase.vercel.app)**

NexaBase is a full-stack, production-ready SaaS starter kit that gives you everything you need to ship an AI-powered application:

- **Auth** — Supabase Auth with JWT, protected routes via Next.js middleware
- **AI Chat** — OpenAI GPT-4o mini via LangChain, conversation history, streaming SSE
- **Billing** — Stripe subscriptions (Free / Pro), webhooks, customer portal
- **Usage Tracking** — Atomic per-user monthly quota via a Supabase RPC
- **Error Logging** — Middleware that POSTs unhandled exceptions to any configurable endpoint
- **Docker** — Single `docker compose up` for local development or production
- **Migrations** — Supabase SQL migrations with RLS, triggers, views, and indexes

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Quick Start — Local Development](#quick-start--local-development)
4. [Environment Variables](#environment-variables)
5. [Supabase Setup](#supabase-setup)
6. [Stripe Setup](#stripe-setup)
7. [Running with Docker Compose](#running-with-docker-compose)
8. [Project Structure](#project-structure)
9. [API Reference](#api-reference)
10. [Feature Details](#feature-details)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                      │
│  Next.js 14 App Router  (frontend/ — port 3000)              │
│    ├── middleware.ts  ← JWT route protection                  │
│    ├── /login  /register                                      │
│    ├── /dashboard  /chat  /billing                           │
│    └── /api/webhooks/stripe  ← Stripe events                 │
└────────────────────┬─────────────────────────────────────────┘
                     │ REST / SSE
┌────────────────────▼─────────────────────────────────────────┐
│  FastAPI  (backend/ — port 8000)                              │
│    ├── ErrorLoggingMiddleware  ← POST errors externally       │
│    ├── /api/v1/auth   (register · login · me)                │
│    ├── /api/v1/chat   (send · stream · conversations)        │
│    └── /api/v1/billing (checkout · portal · webhook)         │
│                                                               │
│  LangChain ──► OpenAI GPT-4o mini                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│  Supabase                                                     │
│    ├── Auth (JWT, email/password)                             │
│    ├── PostgreSQL (profiles · conversations · messages)       │
│    └── Row Level Security                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 20 |
| Python | >= 3.12 |
| Docker + Compose | >= 24 |
| Supabase CLI | latest |
| Stripe CLI | latest |

Create accounts at:
- [Supabase](https://supabase.com) — free tier works
- [Stripe](https://stripe.com) — test mode
- [OpenAI Platform](https://platform.openai.com) — pay-as-you-go

---

## Quick Start — Local Development

### 1. Clone the repository

```bash
git clone https://github.com/AaronCx/NexaBase.git
cd NexaBase
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env        # Fill in all values (see Environment Variables)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs` (only when `DEBUG=true`)

### 3. Set up the frontend

```bash
cd frontend
cp .env.local.example .env.local   # Fill in all values
npm install
npm run dev
```

App available at: `http://localhost:3000`

### 4. Apply Supabase migrations

```bash
# Option A — Supabase CLI (recommended)
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Option B — Direct psql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql \
  -f supabase/migrations/002_usage_rpc.sql \
  -f supabase/migrations/003_indexes_and_views.sql
```

### 5. Set up Stripe webhooks (local)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret -> STRIPE_WEBHOOK_SECRET in .env files
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Random 32-byte secret for internal JWTs |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase **service role** key (never expose client-side) |
| `SUPABASE_JWT_SECRET` | From Supabase Dashboard -> Settings -> API -> JWT Secret |
| `OPENAI_API_KEY` | OpenAI API key (`sk-...`) |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for the Pro subscription |
| `FREE_TIER_MONTHLY_MESSAGES` | Monthly quota for Free tier (default: 50) |
| `PRO_TIER_MONTHLY_MESSAGES` | Monthly quota for Pro tier (default: 5000) |
| `ERROR_LOG_ENDPOINT` | Optional URL to POST error payloads to |
| `ERROR_LOG_API_KEY` | Bearer token for the error logging endpoint |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon** public key |
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (used only in API route) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (used in API route) |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Pro plan Stripe Price ID |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL for Stripe redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (used in webhook route only) |

---

## Supabase Setup

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Copy **Project URL**, **Anon key**, **Service role key**, and **JWT Secret** from
   *Settings -> API*
3. Enable **Email auth** in *Authentication -> Providers*
4. Run the three migrations (see Quick Start step 4)

### Row Level Security

All tables have RLS enabled. Key policies:
- `profiles` — users can only `SELECT`/`UPDATE` their own row
- `conversations` — users own their conversations (full CRUD)
- `messages` — users can read/write messages in their own conversations
- `usage_logs` — users can only read their own audit entries

The backend uses the **service role** key which bypasses RLS — this is intentional and safe as all business-logic authorization happens in the FastAPI layer.

---

## Stripe Setup

1. Create a product in the Stripe Dashboard: *Products -> Add product*
   - Name: **NexaBase Pro**
   - Price: **$19.00/month** (recurring)
   - Copy the **Price ID** -> `STRIPE_PRO_PRICE_ID`

2. Create a webhook endpoint:
   - *Developers -> Webhooks -> Add endpoint*
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the **Signing secret** -> `STRIPE_WEBHOOK_SECRET`

3. Enable the [Customer Portal](https://dashboard.stripe.com/settings/billing/portal) in the Stripe Dashboard.

---

## Running with Docker Compose

### Development (no nginx)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit both files with real values, then:

docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs (DEBUG=true): `http://localhost:8000/docs`

### Production (with nginx)

```bash
# Place TLS certs in nginx/certs/fullchain.pem and nginx/certs/privkey.pem
docker compose --profile production up --build -d
```

---

## Project Structure

```
nexabase/
├── frontend/                   # Next.js 14 (App Router)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      <- Server-side session guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   └── billing/page.tsx
│   │   └── api/webhooks/stripe/route.ts
│   ├── components/
│   │   ├── ui/                 <- shadcn/ui primitives
│   │   ├── chat/ChatInterface.tsx
│   │   ├── billing/BillingContent.tsx
│   │   └── DashboardNav.tsx
│   ├── hooks/                  <- useAuth, useChat, useToast
│   ├── lib/
│   │   ├── api.ts              <- FastAPI client
│   │   └── supabase/           <- Client + Server helpers
│   ├── middleware.ts            <- Protected routes
│   └── types/supabase.ts
│
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── api/                <- auth, chat, billing routers
│   │   ├── core/               <- config, security, database
│   │   ├── middleware/         <- ErrorLoggingMiddleware
│   │   ├── models/schemas.py
│   │   └── services/           <- langchain, usage, stripe
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_usage_rpc.sql
│   │   └── 003_indexes_and_views.sql
│   └── config.toml
│
├── nginx/nginx.conf
├── docker-compose.yml
└── README.md
```

---

## API Reference

All backend routes are prefixed `/api/v1`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create account, returns JWT |
| `POST` | `/auth/login` | — | Sign in, returns JWT |
| `GET`  | `/auth/me` | Bearer | Current user profile |
| `POST` | `/auth/logout` | Bearer | Logout |

### Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/chat` | Bearer | Send message, get reply |
| `POST` | `/chat/stream` | Bearer | SSE streaming reply |
| `GET`  | `/chat/conversations` | Bearer | List conversations |
| `GET`  | `/chat/conversations/{id}` | Bearer | Get messages |
| `GET`  | `/chat/usage` | Bearer | Usage stats |

### Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/billing/checkout` | Bearer | Create Stripe Checkout session |
| `POST` | `/billing/portal` | Bearer | Open Stripe Customer Portal |
| `GET`  | `/billing/subscription` | Bearer | Subscription status |
| `POST` | `/billing/webhook` | Stripe sig | Handle Stripe events |

---

## Feature Details

### Protected Routes

`frontend/middleware.ts` runs before rendering on every request:
1. Creates a Supabase middleware client and refreshes the session cookie
2. Redirects unauthenticated users from `/dashboard`, `/chat`, `/billing` to `/login?redirectTo=...`
3. Redirects authenticated users away from `/login` and `/register` to `/dashboard`

### JWT Auth

Two JWT sources are supported in the FastAPI `get_current_user` dependency:
- **Supabase JWTs** — verified with `SUPABASE_JWT_SECRET`
- **Internal JWTs** — created by `/auth/login` signed with `SECRET_KEY`

### Usage Tracking

The `increment_message_usage` Supabase RPC atomically:
1. Locks the user's `profiles` row
2. Resets the counter on new calendar month
3. Returns `quota_exceeded: true` (without incrementing) if over limit
4. Otherwise increments `messages_used_this_month` and appends a `usage_logs` row

FastAPI raises HTTP 429 on quota exhaustion.

### Error Logging Middleware

`ErrorLoggingMiddleware` in `backend/app/middleware/error_logging.py`:
- Wraps every request in a try/except
- Returns `{"detail": "Internal server error", "error_id": "uuid"}` on error
- If `ERROR_LOG_ENDPOINT` is set, POSTs an async payload with exception type, message, traceback, path, and timestamp

---

## Deployment

### Production (Vercel)

The frontend is deployed on **Vercel** at [nexabase.vercel.app](https://nexabase.vercel.app).

1. **Frontend**: Deploy `frontend/` to Vercel; set `NEXT_PUBLIC_API_URL` to backend URL
2. **Backend**: Deploy `backend/` to any container host (Render, Railway, Fly.io)
3. Update Stripe webhook URL to production domain
4. Push migrations to production Supabase project

### Docker (self-hosted)

```bash
docker compose --profile production up --build -d
```

---

## License

MIT