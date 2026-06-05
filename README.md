# Smoky Bubble Loyalty Program

A two-screen loyalty program web app for Smoky Bubble smoke shop. Staff use one tablet at the counter; customers use a second facing-out display.

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project** and choose a name (e.g. `smoky-bubble`).
3. Select **US East** region and set a strong database password.
4. Wait for the project to finish initializing (~1 minute).

### 2. Get Your API Credentials

1. In your Supabase project, go to **Settings → API**.
2. Copy the **Project URL** (looks like `https://xxxxxx.supabase.co`).
3. Copy the **anon / public** key.

### 3. Create Your `.env` File

In the project root, create a file named `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with what you copied in step 2.

### 4. Run the Database Schema

In your Supabase project, go to **SQL Editor** and paste and run the following:

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  points int default 0,
  vape_under20_count int default 0,
  vape_over20_count int default 0,
  created_at timestamp default now()
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  points_added int,
  action text,
  created_at timestamp default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null
);

insert into settings (key, value) values
  ('points_per_dollar', '1'),
  ('vape_threshold', '7'),
  ('google_review_url', 'https://g.page/r/your-google-review-link'),
  ('rewards', '[
    {"emoji":"🏷","name":"10% off purchase","pts":150},
    {"emoji":"🎁","name":"Free wrap","pts":200},
    {"emoji":"💨","name":"Free vape kit","pts":500},
    {"emoji":"⭐","name":"Premium bundle","pts":750}
  ]');
```

Also enable **Realtime** for the `customers` and `settings` tables:
- Go to **Database → Replication**
- Toggle on `customers` and `settings` tables

### 5. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173/staff](http://localhost:5173/staff) for the staff dashboard.
Open [http://localhost:5173/customer](http://localhost:5173/customer) for the customer display.

### 6. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/smoky-bubble.git
git push -u origin main
```

### 7. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
3. Click **Deploy**.
4. Your app will be live at `https://your-project.vercel.app`.

### 8. Staff Tablet Setup

1. Open Chrome on the staff tablet.
2. Navigate to `https://your-project.vercel.app/staff`
3. Press `F11` (or use Chrome menu → "Cast, save, and share" → "Install page as app") to go fullscreen.
4. Keep this tab open at the counter.

### 9. Customer Tablet Setup

1. Open Chrome on the customer-facing tablet.
2. Navigate to `https://your-project.vercel.app/customer`
3. Go fullscreen.
4. The screen auto-resets to the welcome state after 45 seconds of inactivity.

---

## Usage

### Staff Dashboard (`/staff`)

- **Customers tab**: Look up a customer by phone number. If not found, register them. Then:
  - Tap a dollar amount tile to add points for a purchase
  - Edit points manually if needed
  - Redeem rewards (grayed out if insufficient points)
  - Track vape punch cards (under/over $20)
- **Manage Rewards tab**: Edit points rate, reward tiers, vape threshold, and Google review URL. Hit "Save All Changes" when done — changes propagate live to all screens.

### Customer Display (`/customer`)

- Customers enter their phone number (and name if new) to check their balance.
- Shows points total, reward progress, unlocked rewards, and vape punch card.
- Automatically returns to welcome screen after 45 seconds of inactivity.
- Displays a Google review QR code on the welcome screen (once configured).
