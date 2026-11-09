# TELAPOKA — Shared Payment Tracker

A private, single-owner PWA for tracking recurring money you collect from people —
WiFi shares, flat rent, generator fuel, anything monthly. **You** are the only user;
everyone else is just a name you track. No accounts, no shared access, no AI features.

Built for the **TELAPOKA** brand (red/black wordmark) as an installable **Progressive Web App**
deployable on Vercel with your own domain (`telapoka.com`).

## Features

| Area | What you get |
| --- | --- |
| Trackers | Create unlimited trackers (name, emoji icon, brand color, default monthly due, reminder day) |
| People | Add people per tracker — name (unique per tracker), phone, photo, per-person due amount |
| Mark paid | Bottom-sheet flow: amount, method (Cash / bKash / Nagad / Bank / Other), date, note — with spring check-mark animation + haptic |
| Dashboard | Current month at a glance: expected vs collected, animated progress ring, pending chips, days overdue |
| Reminders | Overdue banner, one-tap **WhatsApp / SMS nudge** with prefilled localized message, browser notification on reminder day |
| History | Full month-by-month history per person; mark/unmark any past month |
| Reports | Yearly stacked bar chart by tracker, per-tracker & per-person rankings, **CSV + PDF export** |
| Backup | One-tap JSON backup export & restore |
| PWA | Installable on Android/iOS home screen, offline app shell, Telapoka wordmark icons (light/dark) |
| i18n | English + বাংলা switch, full dark theme, currency presets (৳ BDT default, $, €, £, ₹) |

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + shadcn/ui + **Material-inspired** custom theme (Telapoka red `#E11D2E`)
- **Framer Motion** — shared-element transitions (dashboard → tracker → person), animated ring, paid check
- **Recharts** — yearly collection charts
- **Prisma ORM** — SQLite locally, swap to PostgreSQL for production (see `prisma/schema.postgres.prisma`)
- **TanStack Query** — data fetching with invalidation; **Zustand** — UI state
- **vaul** — Material-style bottom sheets; **sonner** — toasts
- **jspdf + jspdf-autotable** — PDF export

## Local development

```bash
bun install
bun run db:push      # create SQLite db (db/custom.db)
bun run dev          # http://localhost:3000
```

Lint & types:

```bash
bun run lint
bunx tsc --noEmit
```

## Deploy to Vercel (production)

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full step-by-step guide:
GitHub → Vercel → PostgreSQL (Neon) → domain `telapoka.com` → install as an app.

## Project layout

```
prisma/schema.prisma            # data model (SQLite for local dev)
prisma/schema.postgres.prisma   # production Postgres variant
src/app/api/                    # REST route handlers (state, trackers, people, payments, reports, settings, backup, export)
src/components/app/             # dashboard, tracker & person views, sheets, dialogs, reports, settings
src/lib/                        # i18n (EN/বাংলা), formatting, store, API client, Prisma client
public/brand/                   # TELAPOKA wordmark + PWA icons (generated from your logo)
public/manifest.webmanifest     # PWA manifest
public/sw.js                    # service worker (app-shell cache, API always network)
```

## Data model

- **Tracker** — name, icon, color, `defaultDue`, `reminderDay` (1–28)
- **Person** — belongs to a tracker, unique name per tracker, optional phone/photo, `dueAmount`
- **Payment** — one per person per month (`YYYY-MM`), amount, method, paid date, note
- **Settings** — global currency, currency code, default reminder day

Validation is enforced server-side: no duplicate tracker names, no duplicate person names
within a tracker (case-insensitive), due amounts > 0, valid month/method/date.
