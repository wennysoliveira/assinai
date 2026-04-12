# Workspace — Gestão de Assinaturas Recorrentes

## Overview

SaaS for managing recurring subscriptions with PIX payment integration (QQPag) and WhatsApp notifications (Uazapi). Built as a pnpm workspace monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Icons**: Lucide React
- **Charts**: Recharts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Database Schema (lib/db/src/schema/)
- **services** — id, name, description, active (boolean), created_at, updated_at
- **customers** — id, name, whatsapp, cpf_cnpj, status (active/inactive)
- **subscriptions** — id, customer_id, service_id (FK→services, nullable), plan, periodicity (monthly/annual), amount, status (active/cancelled/overdue), next_billing_date
- **invoices** — id, subscription_id, customer_id, amount, status (pending/paid/overdue/cancelled), due_date, paid_at, pix_code, pix_qr_code, external_id

### API Routes (artifacts/api-server/src/routes/)
- **services** — CRUD for service management
- **customers** — CRUD for customer management
- **subscriptions** — CRUD for subscription management (delete = cancel); joins services table for serviceName
- **invoices** — List/get invoices, generate PIX charge, send WhatsApp reminder
- **dashboard** — Summary metrics (MRR, Churn, Revenue), recent payments, monthly revenue chart data
- **billing** — Process due subscriptions (cron job endpoint)
- **webhooks** — QQPag payment confirmation webhook (/api/webhooks/qqpag)

### Services (artifacts/api-server/src/services/)
- **qqpag.ts** — QQPag API integration for PIX charge generation (POST /pix/cobranca)
- **uazapi.ts** — Uazapi API integration for WhatsApp messages (payment reminders, payment confirmations)

### Frontend Pages (artifacts/subscriptions-app/src/pages/)
- **Dashboard** (/) — MRR, Active Subscriptions, Churn Rate, Today's Revenue, Pending/Overdue Invoices, Revenue Chart, Recent Payments
- **Customers** (/customers) — CRUD with search and status filter
- **Services** (/services) — CRUD for services (name, description, active toggle); shown in subscription form
- **Subscriptions** (/subscriptions) — CRUD with customer + service selection, status filter; shows serviceName column
- **Invoices** (/invoices) — List with PIX generation and WhatsApp reminder actions
- **Settings** (/settings) — API configuration overview, webhook URLs, and theme color customization

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `QQPAG_BASE_URL` — QQPag API base URL
- `QQPAG_TOKEN` — QQPag authentication token
- `UAZAPI_BASE_URL` — Uazapi API base URL
- `UAZAPI_TOKEN` — Uazapi authentication token
- `SESSION_SECRET` — Session secret

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
