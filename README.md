# Saath Phere — Wedding Planner

A comprehensive, beautifully designed wedding planning platform built with **Next.js 14**, **Supabase**, **Tailwind CSS**, and **shadcn/ui**. Tailored for Indian weddings — every ceremony from haldi to vidaai, INR currency, DD/MM/YYYY dates, bride/groom side guest categorisation, English/Hindi/Gujarati UI.

> Includes everything from MVP through the premium tier: AI recommendations, real-time budget alerts, QR check-in, drag-and-drop seating, PDF exports, photo gallery, gift registry, multi-user collaboration, and a multilingual PWA.

## Quick links

- **Live setup**: see [Setup](#setup) below
- **Architecture**: 14 tables in PostgreSQL with RLS, App Router + RSC, real-time channels
- **Deploy**: one-click to Vercel + Supabase

---

## Features

### MVP

- **Authentication** — email/password, role selection (bride / groom / family / planner), password reset, protected dashboard routes
- **Events** — multiple ceremony events per couple, theme picker with preset palettes (Royal Red & Gold, Pastel Pink, etc.) + custom colors
- **Guest list & RSVP** — search, filter by side / RSVP status, CSV bulk import, RSVP tracker
- **Budget** — categorised items, estimated vs actual vs paid, pie chart + progress bars, payment history
- **Vendors** — directory with category filters, side-by-side comparison, contract status, ratings
- **Dashboard** — stats cards, upcoming events, budget snapshot, pending tasks, live countdown

### Phase 2

- **Tasks** — kanban board (todo / in-progress / completed / cancelled), assignments, due-date alerts
- **Timeline** — chronological day-of schedule grouped by date
- **Documents** — Supabase Storage, drag-and-drop upload, category tagging, inline preview
- **QR check-in** — per-guest QR codes for printed invitations, public `/checkin/[eventId]` page
- **Seating planner** — `@dnd-kit` drag-and-drop tables/guests, persists to `events.seating_layout`
- **Collaboration** — invite family / planners by email via Supabase admin invite + `event_collaborators`
- **Email invitations** — Resend templates with RSVP links
- **WhatsApp share** — `wa.me` deep links with pre-filled invitation text
- **PDF export** — guest list and budget reports via `@react-pdf/renderer`
- **Photo gallery** — per-event album in Supabase Storage with lightbox preview
- **Gift registry** — wishlist with images, prices, claim status

### Phase 3 (Premium)

- **AI budget recommendations** — OpenAI GPT-4o-mini suggests category allocations, with deterministic fallback when no key is set
- **Vendor reviews** — 5-star ratings with comments
- **Real-time budget alerts** — toast notifications when category spend crosses 80% / 100%
- **Razorpay payments** — full order + signature verify flow, auto-records `payments` row
- **Travel & accommodation** — arrival dates, hotel info per guest, summary view
- **Live countdown** — days / hours / mins / secs ticker
- **Social share** — Open Graph tags + WhatsApp / Twitter / Facebook buttons
- **i18n** — English, हिन्दी, ગુજરાતી via `next-intl` (cookie-based, no URL changes)
- **PWA** — manifest + service worker for offline shell

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript |
| Database / Auth / Storage / Realtime | Supabase |
| Styling | Tailwind CSS + shadcn/ui + Radix primitives |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Drag & drop | @dnd-kit/core |
| PDF | @react-pdf/renderer |
| QR | qrcode |
| i18n | next-intl |
| AI | OpenAI |
| Payments | Razorpay |
| Email | Resend |
| State | React Context + Supabase Realtime + Zustand (optional) |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project
2. From **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (used for collaborator invites only)

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — enables Phase 2/3 features
RESEND_API_KEY=re_xxxxxxx              # email invitations
RESEND_FROM=Saath Phere <hi@yourdomain>
OPENAI_API_KEY=sk-xxxxxxx               # AI budget recommendations
RAZORPAY_KEY_ID=rzp_test_xxx            # payments
RAZORPAY_KEY_SECRET=xxx
```

### 4. Run the database migration

In Supabase Studio → **SQL Editor**, paste the contents of:

- [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql) — 14 tables, RLS policies, indexes, triggers, seed budget categories
- [`supabase/storage_setup.sql`](supabase/storage_setup.sql) — storage buckets (`event-documents`, `event-photos`, `avatars`, `contracts`) and their RLS policies

Click **Run** for each file.

### 5. Enable Realtime (optional but recommended)

In Supabase Studio → **Database → Replication**, enable Realtime for the tables you want live updates on (events, guests, budget_items, tasks, payments, documents, gifts).

### 6. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), sign up, and start planning!

---

## Project structure

```
app/
  (auth)/            # Login, signup, password reset
  (dashboard)/       # Protected dashboard pages
    dashboard/       # Home
    events/          # Events CRUD + nested sub-pages (guests, budget, vendors,
                     #   tasks, timeline, documents, seating, gallery, gifts,
                     #   travel)
    guests/          # All guests across events
    budget/          # All-event budget overview
    vendors/         # Vendor directory + /[id] detail with reviews
    tasks/           # All tasks
    timeline/        # All timelines
    documents/       # All documents
    gallery/         # All galleries
    gifts/           # All gift registries
    settings/        # Profile + collaborators
  checkin/[eventId]/ # Public check-in page (QR scan target)
  api/
    qr/[guestId]/                 # Guest QR PNG
    invitations/send/             # Resend email invites
    export/{guests,budget}/       # PDF exports
    collaborators/invite/         # Supabase admin invite
    ai/budget-recommendations/    # OpenAI route
    payments/razorpay/{order,verify}/

components/
  ui/             # shadcn/ui primitives
  dashboard/      # Sidebar, Header, StatsCard, LiveCountdown
  events/         # EventForm, EventCard, ThemePicker
  guests/         # GuestForm, GuestTable, RSVPTracker, GuestImport,
                  # GuestQRCard, InvitationActions, TravelInfoForm
  budget/         # BudgetTable, BudgetChart, ExpenseForm, PaymentTracker,
                  # AIRecommendations
  vendors/        # VendorCard, VendorForm, VendorComparison, VendorReviews
  tasks/          # TaskForm, TasksKanban
  timeline/       # TimelineItem, TimelineView
  documents/      # DocumentUpload, DocumentList
  seating/        # SeatingPlanner
  gallery/        # PhotoGallery
  gifts/          # GiftForm, GiftList
  shared/         # EmptyState, ErrorBoundary, LoadingSpinner,
                  # LanguageSwitcher, ShareButtons, ServiceWorkerRegister

lib/
  supabase/       # client.ts, server.ts, middleware.ts
  hooks/          # useAuth, useEvents, useGuests, useBudget, useVendors,
                  # useTasks, useTimeline, useDocuments, useGallery,
                  # useGifts, useBudgetAlerts
  utils/          # formatting, calculations, validation
  types/          # database.types.ts
  constants.ts    # event types, themes, options

messages/         # en.json, hi.json, gu.json (next-intl translations)
i18n.ts           # next-intl request config
public/           # manifest.json, sw.js, icons/
supabase/         # SQL migrations
```

---

## Deploy

### Vercel + Supabase (recommended)

1. Push this repo to GitHub
2. Import into [vercel.com/new](https://vercel.com/new)
3. Add the same environment variables from `.env.local`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL
5. Deploy

In Supabase Auth → **URL Configuration**:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: add `https://your-domain.com/auth/callback`

---

## Environment variables checklist

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | for invites | `/api/collaborators/invite` |
| `NEXT_PUBLIC_APP_URL` | recommended | absolute URLs in emails / QR codes / social share |
| `RESEND_API_KEY` | optional | email invitations |
| `RESEND_FROM` | optional | sender address (default `invitations@resend.dev`) |
| `OPENAI_API_KEY` | optional | AI budget recommendations |
| `RAZORPAY_KEY_ID` | optional | Razorpay order creation |
| `RAZORPAY_KEY_SECRET` | optional | Razorpay signature verification |

---

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
npm run format   # prettier
```

---

## License

MIT — built with ❤ for couples everywhere.
