# 🌿 GreenMart — Smart Supermarket App
### Built by Kimathi Joram · Geopram Technologies
**Contact:** celestakim018@gmail.com

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase (get from https://app.supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# M-Pesa (already configured - update if needed)
MPESA_CONSUMER_KEY=zy6Tc09PA8eteY3Mf5MVmiA590zOFgnCpJVdbF3ZeG
MPESA_CONSUMER_SECRET=KZ7pRIGv7y0FrdPThgVxxrvXHQhX8kHZLSKQxgMzA1RleTEMcSMnGscGiA
MPESA_SHORTCODE=4574727
MPESA_PASSKEY=9d09b38cbf40d3dc7bb1b627954f9e22129fdc4b9209905e96ce031
MPESA_CALLBACK_URL=https://project-g2tnn.vercel.app/api/mpesa/callback
MPESA_ENV=sandbox   # Change to 'production' for live

# Admin
ADMIN_EMAIL=geopramtech@gmail.com
ADMIN_PASSWORD=GeoPramTech72222
```

### 3. Set Up Supabase Database
1. Go to [app.supabase.com](https://app.supabase.com)
2. Open your project → **SQL Editor**
3. Paste and run the contents of `supabase-setup.sql`
4. Verify the `supa_shop_sales` table and `payment-proofs` bucket are created

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
greenmart/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, toasts)
│   │   ├── globals.css             # Tailwind + custom CSS
│   │   ├── page.tsx                # 🛒 Storefront (products, cart, checkout)
│   │   ├── api/
│   │   │   ├── auth/login/         # Admin login endpoint
│   │   │   ├── mpesa/
│   │   │   │   ├── stk-push/       # Initiate M-Pesa STK Push
│   │   │   │   └── callback/       # M-Pesa payment callback (Vercel)
│   │   │   └── sales/
│   │   │       ├── submit/         # Manual payment + image upload
│   │   │       ├── list/           # Fetch all sales (admin)
│   │   │       └── update-status/  # Confirm/reject orders
│   │   └── dashboard/
│   │       ├── layout.tsx          # Admin sidebar + auth guard
│   │       ├── page.tsx            # Overview with stats
│   │       ├── login/page.tsx      # Admin login page
│   │       ├── sales/page.tsx      # Sales management table
│   │       ├── customers/page.tsx  # Customer analytics
│   │       └── analytics/page.tsx  # Revenue charts
│   └── lib/
│       ├── supabase.ts             # Supabase client + types
│       ├── mpesa.ts                # M-Pesa API helpers
│       └── auth.ts                 # Admin auth helpers
├── supabase-setup.sql              # Database setup script
├── vercel.json                     # Vercel deployment config
├── tailwind.config.js
├── next.config.js
└── .env.local                      # Your environment variables
```

---

## 🌐 Deployment to Vercel

### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: GitHub + Vercel Dashboard
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy!

### Environment Variables for Vercel
Add these in Vercel Dashboard → Project → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_ENV`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

---

## 💳 M-Pesa Payment Flow

### STK Push (Automatic)
1. Customer fills cart → enters details → clicks "Send STK Push"
2. App calls `/api/mpesa/stk-push` → Safaricom sends prompt to phone
3. Customer enters PIN → Safaricom posts result to `/api/mpesa/callback`
4. Callback updates order status to `confirmed` or `rejected` in Supabase

### Manual Payment
1. Customer pays via Paybill **4574727**
2. Enters M-Pesa transaction code (e.g. `RBC4KQ8A3X`)
3. Optionally uploads screenshot as proof
4. Admin reviews and confirms/rejects in dashboard

---

## 🔐 Admin Dashboard

Access: `/dashboard`
- **Email:** geopramtech@gmail.com
- **Password:** GeoPramTech72222

### Features
- 📊 Overview: sales stats, revenue, pending orders
- 📋 Sales: full table with search, filter, pagination, export CSV
- 👥 Customers: aggregated customer list with spending data
- 📈 Analytics: daily revenue chart, status breakdown, popular items

---

## 🗄️ Database Schema

Table: `supa_shop_sales`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMPTZ | Order timestamp |
| customer_name | TEXT | Full name |
| customer_email | TEXT | Email address |
| customer_phone | TEXT | Phone number |
| transaction_code | TEXT | M-Pesa receipt number |
| amount | NUMERIC | Order total (KES) |
| items | TEXT | Comma-separated item list |
| payment_proof_url | TEXT | Supabase storage URL |
| mpesa_checkout_id | TEXT | STK Push checkout ID |
| status | TEXT | pending / confirmed / rejected |

Storage bucket: `payment-proofs` (public, 5MB limit, images only)

---

## 📞 Support

**Kimathi Joram**
- Email: celestakim018@gmail.com
- Phone: 0101370035

**Geopram Technologies**
- Email: geopramtech@gmail.com
- Phone: 0702781490

---

*© 2024 GreenMart · Geopram Technologies · All rights reserved*
