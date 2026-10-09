# MotoCare — Bike Servicing Management Dashboard (Next.js)

Modern, responsive dashboard for a bike servicing center. Manage customers, bikes, and service records through the Bike Servicing Management API.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, Axios, React Hook Form + Zod, Lucide icons, and Recharts.

## Features

- **Dashboard** (`/`): live stats (customers, bikes, services, pending, completed, overdue), recent services, status chart, overdue preview, quick actions.
- **Customers** (`/customers`, `/customers/:id`): searchable table, add / edit (modal form with validation), delete with confirmation, detail page with bikes + service history.
- **Bikes** (`/bikes`, `/bikes/:id`): searchable table (brand / model / owner), add with customer dropdown loaded from API, detail page with owner + service history + “create service” shortcut.
- **Services** (`/services`, `/services/:id`): search + status filter + date filter, create, mark as completed (list + detail), completion dates, status badges (Pending = yellow, In Progress = blue, Done = green).
- **Overdue** (`/overdue-services`): `GET /services/status` (pending / in-progress older than 7 days), highlighted cards, empty state.
- UX: loading skeletons/spinners, success + error toasts, form validation messages, empty states, retry on failure, delete confirmations, responsive sidebar (collapses on mobile), horizontally scrollable tables.

## API

Default base URL: `https://bike-server-api.vercel.app/api`

| Feature | Method + Endpoint |
|---|---|
| List / create customers | `GET` / `POST /customers` |
| Customer details / update / delete | `GET` / `PUT` / `DELETE /customers/:id` |
| List / create bikes | `GET` / `POST /bikes` |
| Bike details | `GET /bikes/:id` |
| List / create services | `GET` / `POST /services` |
| Overdue services | `GET /services/status` |
| Service details | `GET /services/:id` |
| Complete service | `PUT /services/:id/complete` |

Service statuses: `pending` | `in-progress` | `done`.

## Getting started

Requirements: Node.js 18.18+ (20+ recommended), npm.

```bash
# 1. Install
npm install

# 2. Configure API (optional — defaults to the hosted API)
cp .env.example .env.local
# edit NEXT_PUBLIC_API_BASE_URL if running your own backend, e.g.:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# 3. Run
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## Project structure

```
app/
  page.tsx                    Dashboard
  customers/page.tsx          Customer list + create/edit/delete
  customers/[id]/page.tsx     Customer details
  bikes/page.tsx              Bike list + create
  bikes/[id]/page.tsx         Bike details + service history
  services/page.tsx           Service list + filters + create + complete
  services/[id]/page.tsx      Service details + complete
  overdue-services/page.tsx   Overdue list (GET /services/status)
  layout.tsx                  Root layout + metadata
  not-found.tsx               404 page
components/
  app-shell.tsx  sidebar + header + toast wiring (client)
  sidebar.tsx    navigation with active state + mobile drawer
  header.tsx     page title + profile placeholder
  ui.tsx         cards, badges, skeletons, modals, buttons, inputs
  toast.tsx      toast provider (success / error)
  customer-form.tsx / bike-form.tsx / service-form.tsx
lib/
  api.ts    axios instance + typed API functions + error helper
  types.ts  Customer / Bike / ServiceRecord / envelopes
  utils.ts  formatting + overdue helpers
```

## Environment

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | REST API base URL (with `/api` suffix) | `https://bike-server-api.vercel.app/api` |

## Notes

- All data is live from the API — no hardcoded demo stats.
- Forms use React Hook Form + Zod; the backend response is the source of truth (server messages surface in toasts / form errors).
- Auth, payments, notifications, and booking portal are out of scope (per PRD).
