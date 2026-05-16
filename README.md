# AtomQuest — Goal Setting & Tracking Portal

A full-stack OKR/KPI management portal with role-based access, approval workflows, quarterly check-ins, analytics, and real-time notifications.

## 🚀 Live Demo

> Deploy to Vercel (see below) and run `supabase/seed.sql` in your Supabase SQL Editor.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo.com | password123 |
| Manager | manager@demo.com | password123 |
| Admin / HR | admin@demo.com | password123 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| Charts | Recharts |
| Email | Resend via Supabase Edge Function |
| Hosting | Vercel (frontend) + Supabase (backend) |

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── layout/       # AppLayout, sidebar, navbar
│   └── ui/           # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx   # Auth context provider
│   └── useNotifications.ts  # Real-time notification hook
├── lib/
│   ├── supabase.ts   # Supabase client
│   ├── scoreLogic.ts # Score computation formulas
│   └── utils.ts      # Utility functions
├── pages/
│   ├── Login.tsx     # Login + Demo Guide modal
│   ├── employee/     # My Goals, Quarterly Check-ins
│   ├── manager/      # Team Dashboard, Check-in Module, Reports
│   ├── admin/        # Cycle Management, Analytics, Audit, Escalations
│   └── shared/       # Achievement Report
├── types/
│   └── supabase.ts   # Database type definitions
supabase/
├── schema.sql         # Full DB schema + RLS policies + audit trigger
└── seed.sql           # Demo data seeding script
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Accquit/Atomquest.git
cd atomquest
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to **SQL Editor**
3. Paste and run `supabase/schema.sql` (creates tables, RLS policies, and audit trigger)
4. Create these auth users in **Authentication → Users → Add User**:
   - `admin@demo.com` / `password123`
   - `manager@demo.com` / `password123`
   - `manager2@demo.com` / `password123`
   - `employee@demo.com` / `password123`
   - `emp2@demo.com` / `password123`
   - `emp3@demo.com` / `password123`
   - `emp4@demo.com` / `password123`
   - `emp5@demo.com` / `password123`
5. Paste and run `supabase/seed.sql` to populate demo data

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Deploy to Vercel

```bash
npm run build
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) and add environment variables in the Vercel dashboard.

---

## 🎯 Features

### Role-Based Access
- **Employee** — Create goals (up to 8, total weightage = 100%), submit for approval, log quarterly check-ins, view computed scores
- **Manager** — Review team goals, inline-edit targets/weightage, approve or return for rework, add structured check-in comments
- **Admin/HR** — Manage goal cycles (open/close phases), push shared KPIs to employees, unlock goals, view full audit trail, manage escalation rules

### Approval Workflow
1. Employee creates draft goals → submits to manager
2. Manager reviews → approves (locks goals) or returns for rework
3. Admin can unlock any locked goal (logged to audit trail)

### Quarterly Check-ins
- Portal enforces check-ins only within the active quarter window (configured by Admin)
- Shows "Window Closed" state outside active periods
- **Score computation** per UoM type:
  - `numeric_min` — score = actual / target (capped at 1.0)
  - `numeric_max` — score = target / actual (capped at 1.0)
  - `timeline` — 1.0 if completed on/before deadline, else 0
  - `zero` — 1.0 if actual === 0, else 0.0

### Bonus Features
- 📊 **Analytics** — QoQ trend, department bar chart, goal distribution pie chart (Recharts)
- 🔔 **Real-time Notifications** — Bell icon with unread count badge, Supabase real-time subscription
- 📧 **Email Notifications** — Architecture ready for Supabase Edge Function + Resend
- ⚠️ **Escalation Rules** — Admin-configurable rules with day thresholds
- 📋 **Audit Trail** — Postgres trigger logs every goal status change
- 📤 **CSV Export** — Achievement report downloadable as CSV

---

## 🏗️ Architecture

```
Browser (React + Vite)
    │
    ▼
Vercel CDN (Static Files)
    │
    ▼
Supabase Auth ─── JWT Token ───► Row Level Security
    │
    ├── PostgreSQL (Goals, Profiles, Achievements, Notifications)
    │
    └── Edge Functions ──────────► Resend (Email Notifications)
```

---

## 📝 License

MIT
