# 🏎️ VendorBridge: High-Performance Procurement Platform

**VendorBridge** is a lightning-fast, high-fidelity supply chain and procurement dashboard built for modern enterprises. Drawing inspiration from F1 telemetry systems, it features an ultra-responsive dark-mode aesthetic with carbon-fiber styling, neon accents, and robust data persistence.

## ✨ Key Features

- 🏎️ **F1 Telemetry Dashboard**: A stunning, high-contrast dark theme utilizing CSS variables for a sleek, carbon-fiber and neon-red aesthetic.
- 🔐 **Robust Authentication**: Integrated with Supabase Auth for bulletproof session management and instantaneous redirect routing.
- 📦 **End-to-End Procurement**: Seamlessly manage RFQs, vendor quotations, purchase orders, and multi-tax (CGST/SGST/IGST) invoices in one cohesive UI.
- 📊 **Real-Time Analytics**: Built-in reporting metrics utilizing custom `f1-numbers` typography for rapid data consumption.
- ⚡ **Demo Mode vs. Live DB Mode**: Automatically gracefully degrades to a full client-side mock-data mode if database connection variables are missing, ensuring 100% uptime for presentations.
- 🌐 **Vercel Ready**: Fully optimized for Next.js 14 App Router, guaranteeing lightning-fast edge deployments.

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom F1 Design System
- **Backend/DB**: Supabase (PostgreSQL & Auth)
- **State Management**: Zustand
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/vendorbridge.git
cd vendorbridge
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Application
```bash
npm run dev
```
Navigate to `http://localhost:3000` to access the dashboard. 
*Note: If no database keys are provided, the app will automatically launch in high-fidelity **Demo Mode** with pre-populated mock data.*

## 📐 Architecture & Design

### The "Carbon Red" Aesthetic
VendorBridge moves away from boring, generic B2B white-label dashboards. It employs a cohesive "Carbon & Neon" UI matrix:
- **`var(--bg-surface)`**: Deep carbon background for reduced eye strain.
- **`var(--bg-elevated)`**: Glassmorphic elevations for depth.
- **`var(--accent)`**: F1 Racing Red for primary CTAs and critical data highlights.
- **`.f1-numbers`**: A custom monospaced, tightly-kerned typography class for extreme readability on financial data.

## 🤝 Contributing
Contributions are welcome! If you'd like to improve the application, feel free to open a Pull Request.

## 📜 License
This project is licensed under the MIT License.
