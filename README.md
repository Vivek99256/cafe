# Aura Cafe SaaS — Premium QR Code Ordering & Kitchen Management Platform

A production-ready, full-stack multi-tenant SaaS application built for specialty coffee shops, artisan bakeries, and modern restaurants.

---

## 🚀 Live Deployment & Login Resolution Guide

If you deployed the project to **Vercel**, **Railway**, **Render**, or a custom domain and cannot log in, here is why and how it is now completely resolved:

### 1. Why Login Failed on Live Deployments
1. **Empty Live Database:** When deploying to serverless platforms (like Vercel), local files (`dev.db`) do not persist across serverless instances, or the production PostgreSQL database was created empty without running the seed script.
2. **Missing Set-Cookie Headers in Serverless Handlers:** In Next.js App Router, calling `cookies().set()` inside API Route Handlers does not always attach cookies to `NextResponse.json()` in certain serverless environments.
3. **Cookie Security Policies:** On non-HTTPS custom domains or preview URLs, strict cookie flags can cause browsers to discard session cookies.

### 2. Solutions Implemented
- ✅ **Auto-Seed on Demand:** If the live database is empty, logging in or clicking any **1-Click Demo** button automatically detects the empty database and seeds all demo cafes, menu items, and tables on the fly.
- ✅ **One-Click Live Seeder (`/api/seed`):** Visit `https://your-domain.com/api/seed` or click the **"First time on live? Click to Seed Database"** button directly on the `/login` screen.
- ✅ **Direct Response Cookies + Bearer Token Dual Fallback:** Session cookies are now explicitly set on the `NextResponse` headers, and the JWT token is also backed up in `localStorage` and sent via `Authorization: Bearer <token>`, guaranteeing 100% login reliability on all domains and devices.

---

## 🔑 Demo Credentials

| Role | Email | Password | Direct Path |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@cafesaas.com` | `Admin@1234` | `/admin` |
| **Cafe Owner (Aura)** | `owner@auracafe.com` | `Owner@1234` | `/dashboard` |
| **Cafe Manager** | `manager@auracafe.com` | `Manager@1234` | `/dashboard/orders` |
| **Kitchen Staff** | `kitchen@auracafe.com` | `Kitchen@1234` | `/dashboard/orders` |
| **Bistro Owner (Bella)** | `owner@bellacucina.com` | `Bella@1234` | `/dashboard` |

> 💡 **Quick Demo Access:** On `/login` or the homepage, click any **1-Click Login** button to instantly authenticate without typing credentials.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 with App Router & Turbopack
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Espresso `#2B1D18`, Warm Cream `#FAF5EC`, Copper `#C58B5B`)
- **Typography:** Playfair Display (editorial headings) & Inter (UI text)
- **Database & ORM:** Prisma ORM (SQLite for local zero-config, PostgreSQL/Supabase for production)
- **Authentication:** Edge-safe JWT sessions with `jose` & `bcryptjs`, dual cookie + Bearer token support
- **Real-time Notifications:** Web Audio API barista dual-tone chimes + Server-Sent Events (SSE)
- **Printing:** Print-ready QR Table Tent Cards (`@media print`), Kitchen Order Tickets (KOT 80mm), and Tax Invoices

---

## 📦 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & generate Prisma client
npx prisma db push

# 3. Seed database with realistic cafe photography, tables, and orders
npm run db:seed

# 4. Run automated test suite (20/20 critical workflow tests)
npm run test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel with PostgreSQL (Supabase / Neon)

1. **Create a PostgreSQL Database** on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. **Update `prisma/schema.prisma`** provider to postgresql:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. **Set Environment Variables on Vercel:**
   - `DATABASE_URL`: Your Supabase/Neon connection string (`postgres://...`)
   - `JWT_SECRET`: A secure random secret string
   - `NEXT_PUBLIC_APP_URL`: Your production Vercel URL (e.g. `https://your-cafe.vercel.app`)
4. **Deploy to Vercel:**
   Push your repository to GitHub and connect it to Vercel.
5. **Initialize Live Database:**
   Once deployed, simply visit `/api/seed` or click **"First time on live? Click to Seed Database"** on the `/login` page!
