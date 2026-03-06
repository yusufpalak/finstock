# 📊 FinStock — Finance & Stock Mini ERP

A focused, production-ready **Global Multi-Tenant SaaS** for small businesses.

**Stack:** Vue 3 + Fastify + MySQL + Docker + Nginx

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Clone & configure
```bash
git clone <your-repo>
cd finstock-erp
cp .env.example .env
# Edit .env with your values
```

### 2. Start with Docker Compose
```bash
docker compose up -d
```

App is available at:
- Frontend: http://localhost → redirects to http://localhost/tr
- Backend API: http://localhost/api/v1
- Health check: http://localhost/health

### 3. Local development (without Docker)
```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev      # http://localhost:3000

# Frontend (new terminal)
cd frontend
npm install
npm run dev      # http://localhost:5173
```

---

## 🌍 Language Routing

| URL | Language |
|-----|----------|
| `/tr` | Turkish (default) |
| `/en` | English |

---

## 📋 Core Modules

| Module | Description |
|--------|-------------|
| 💰 Transactions | Daily income & expense tracking |
| 📦 Products | Stock management with critical alerts |
| 📋 Receivables | Customer receivables & overdue tracking |
| 📈 Analytics | Cash flow chart, profitability analysis |
| ⚙️ Settings | Tenant config, users, subscription |

---

## 💳 SaaS Plans

| Feature | Basic | Pro |
|---------|-------|-----|
| Transactions | ✓ | ✓ |
| Stock Alerts | ✓ | ✓ Unlimited |
| Cash Flow Chart | ✓ | ✓ |
| Export (CSV) | ✗ | ✓ |
| Multi-Currency | ✗ | ✓ |
| 14-day Trial | ✓ | ✓ |

---

## 🏗️ Architecture

```
Client (Vue 3 SPA)
       │
    Nginx (single domain, /tr + /en routing, SSL)
    ┌───────────────────────────┐
    │ /api/v1/*  → Fastify API  │
    │ /tr, /en   → Vue SPA      │
    └───────────────────────────┘
       │
    Fastify (Node.js)
    ├── JWT Auth middleware
    ├── Tenant context middleware (injects tenantId)
    ├── Plan-based feature middleware
    └── controller → service → repository
       │
    MySQL 8
    ├── Shared DB / Shared Schema
    └── tenant_id on ALL business tables
```

---

## 🔒 Multi-Tenant Isolation

All business tables include `tenant_id`. The `authenticate` middleware injects `req.tenantId` from the JWT. The `BaseRepository` enforces tenant_id on every query — cross-tenant data access is impossible by design.

---

## 🚢 Production Deploy

See `.github/workflows/deploy.yml` for the full CI/CD pipeline.

Required GitHub Secrets:
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- `VITE_API_BASE_URL`

---

## 📁 Project Structure

```
finstock-erp/
├── backend/               # Fastify API
│   └── src/
│       ├── config/        # DB, env
│       ├── middleware/    # auth, plan gating
│       ├── modules/       # auth, transactions, products, receivables, analytics
│       ├── shared/        # base repo, errors
│       ├── jobs/          # exchange rate sync
│       └── migrations/    # SQL schema
├── frontend/              # Vue 3 SPA
│   └── src/
│       ├── i18n/          # tr.json, en.json
│       ├── router/        # /tr /en prefix routing
│       ├── stores/        # Pinia stores
│       ├── composables/   # formatters, feature flags
│       ├── components/    # layout, charts
│       └── views/         # pages
├── nginx/                 # nginx.conf
├── docker-compose.yml
└── .env.example
```
