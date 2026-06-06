# 🏎️ VendorBridge — Enterprise Procurement & Bid Comparison Engine

[![Framework](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![State Management](https://img.shields.io/badge/State-Zustand%20%26%20SWR-blue?style=flat-square)](https://github.com/pmndrs/zustand)
[![Platform](https://img.shields.io/badge/Platform-Vercel%20Optimized-000000?style=flat-square&logo=vercel)](https://vercel.com)

**VendorBridge** is a high-performance, dark-mode supply chain and procurement dashboard built for modern enterprises. Drawing inspiration from **Formula 1 telemetry layouts**, it features a carbon-fiber aesthetic, neon-red borders, glassmorphic card overlays, and high-readability monospaced numerical typography. It includes a fallback client-side "Demo Mode" utilizing local storage storage sync, ensuring immediate presentations work out-of-the-box even without a live database.

---

## 🏎️ Telemetry Design Aesthetics ("Carbon Red")

VendorBridge shifts away from standard corporate dashboards by adopting a sleek motorsport-themed layout optimized for readability:
- **Carbon Surface Elevations**: Uses `var(--bg-surface)` and `var(--bg-elevated)` for structured glassmorphism and depth.
- **F1 Neon-Red Accents**: Critical indicators, primary CTAs, and pending warnings are dressed in `var(--accent)` (`#E10600`) to highlight focal points.
- **Tightly-Kerned Monospace (`.f1-numbers`)**: Uses a custom-kerned monospaced font family for all financial values, budget targets, GST taxes, and counts to prevent visual scanning fatigue.
- **Micro-Animations**: Uses Framer Motion for smooth transitions, list loading animations, and seamless detail drawers.

---

## ⚡ Zero-Config Demo Mode vs. Live Database

VendorBridge is built with dual persistence modes. The application detects the presence of environment variables at startup and dynamically routes queries:

| Feature | 💾 Live Database Mode | ⚡ Demo Mode (No-Config) |
| :--- | :--- | :--- |
| **Trigger** | `.env.local` Supabase keys detected | Missing environment keys |
| **Engine** | PostgreSQL client connections | Local Storage Sync Engine |
| **Seed Source** | Supabase database migrations | `src/utils/supabase/seeds.ts` |
| **Authentication** | Supabase OAuth + Email OTP | Simulation session persistence |
| **Event Logging** | Live server-side audit events | Mock timeline generation |

---

## 🛠️ Complete Feature Breakdown

### 1. Unified Dashboard
- Real-time KPIs tracking total YTD spend, active RFQs, pending invoices, and approved vendors.
- Live telemetry activity feed showing the latest event logs.
- Immediate actions panel highlighting pending manager approvals.

### 2. Request for Quotations (RFQs)
- Create and publish structured procurement bids with target budgets, lines items, units, and deadlines.
- Detail View: A visual modal showing line item specs and invitation progress (Apex Tech, Globex, Pioneer, Titan).

### 3. Vendor Compliance Matrix
- Complete directory listing registered vendors with status indicators (Active, Pending, Suspended, Blacklisted).
- Performance Stats: Displays average ratings, completed order counts, fulfillment rates, and response times.
- Profile View: Detail drawer showcasing headquarters address, primary contact info, and active bids.

### 4. Quotation Comparison Sheet
- Side-by-side comparison sheet comparing bids received for a specific RFQ.
- Lowest-bid Highlights: Cells containing the lowest unit price and lowest total project budget are highlighted in neon-green.
- Contract Awarding: Awarding a contract instantly rejects other quotations, closes the RFQ, and generates a Purchase Order.

### 5. Purchase Orders
- List of issued POs showing delivery schedules, totals, and payment terms.
- Detail View: Modal sheet showing itemized summaries, recipient addresses, and verification tokens.

### 6. Invoices & Billing
- Automated tax split processor separating CGST (9%), SGST (9%), and IGST (18%) depending on business state lines.
- Detail View: Modal containing bank transfer instructions (IFSC, A/C No) and payment status.
- Inline "Pay" button that instantly triggers compliance workflows.

### 7. Approvals Queue
- Requisition matrix listing POs requiring manager-level signature.
- Review Modal: Detailed checklist showing comments, remarks, request origin, and direct "Approve" / "Reject" actions.

### 8. System Audit Stream
- Comprehensive event feed logging actions (`CREATE`, `APPROVE`, `PAYMENT_CONFIRM`, etc.) along with client IP addresses and operators.

---

## 💻 Developer Guide & Installation

### 1. Setup Repository
```bash
git clone https://github.com/SKYLINE217/ODOO-HACKATHON.git
cd ODOO-HACKATHON
npm install
```

### 2. Run Locally
To spin up the local Turbopack development server:
```bash
# Bypassing execution policy restrictions on Windows:
npm.cmd run dev
```
Navigate to `http://localhost:3000`. By default, if no `.env.local` is present, it will initialize in **Demo Mode** with mock data stored in `localStorage`.

### 3. Setup PostgreSQL Database (Optional)
If you wish to use live persistence:
1. Create a project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the schema queries from [schema.sql](file:///d:/Riot%20Games/ODOO%20HACKATHON/schema.sql) and [seed.sql](file:///d:/Riot%20Games/ODOO%20HACKATHON/seed.sql).
3. Create a `.env.local` file in the root workspace folder:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
4. Restart the development server. The dashboard will automatically transition to **Live Database Mode**.

---

## 📐 Architecture & Technology Stack

- **Framework**: Next.js 16.2.7 (App Router with Turbopack)
- **Runtime**: React 19.0.0
- **Database / Auth**: Supabase SSR (`@supabase/ssr` & `@supabase/supabase-js`)
- **State Store**: Zustand + local caching middleware
- **Styling**: Tailwind CSS 4 + custom glassmorphic properties
- **Icons**: Lucide React
- **Build Target**: Optimized for Vercel deployment with edge asset rendering

---

## 📜 License
This project is licensed under the MIT License.
