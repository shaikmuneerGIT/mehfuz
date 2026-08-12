# Mehfuz — Premium Dry Fruits & Commodities

Full-stack e-commerce app for Mehfuz: a React storefront and an Express/Prisma
API, seeded with the Mehfuz product catalog (Anjeer, dates, nuts, raisins,
seeds, dried fruit, saffron, coffee, and spices).

## Stack

- **server/** — Express + TypeScript + Prisma ORM + SQLite, JWT-authenticated
  admin API, Zod request validation.
- **client/** — React + Vite + TypeScript + Tailwind CSS, React Router,
  storefront + admin dashboard.

## Getting started

### 1. Backend

```bash
cd server
npm install
npx prisma migrate dev   # creates dev.db and applies schema
npx prisma db seed       # seeds categories, products, and the admin user
npm run dev              # starts the API on http://localhost:4000
```

Admin login credentials are set in `server/.env` (`ADMIN_EMAIL` /
`ADMIN_PASSWORD`, defaults to `admin@mehfuzdryfruits.com` /
`Mehfuz@Admin123`). **Change these before deploying.**

### 2. Frontend

```bash
cd client
npm install
npm run dev               # starts the storefront on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so
run both servers together during development.

Visit `/admin/login` to sign in to the admin dashboard (manage products,
pack sizes/pricing, and order status).

## Notes & assumptions

- Catalog prices you provided were treated as **price per kilogram**, split
  into 250g / 500g / 1kg tiers using the same ratio as your Anjeer flyer
  (250g ≈ 28% of the 1kg price, 500g ≈ 52%). **Saffron** was treated as
  **price per gram** (₹280/g), since that fits real Kashmiri saffron
  pricing far better than per-kg.
- **Coffee, Black Pepper, and Red Chilli Powder** were listed with no price
  in your message — they're seeded with estimated placeholder prices and
  tagged "Price TBD". Update these in the admin Products page before going
  live.
- Checkout only supports **Cash on Delivery**; no payment gateway is wired
  up. Free shipping over ₹999, flat ₹79 shipping otherwise (both easy to
  change in `server/src/routes/orders.ts` and `client/src/pages/Checkout.tsx`).
- Product imagery uses styled placeholder tiles (no product photography was
  provided) — swap in real photos by replacing `ProductTile` with an
  `<img>` once you have them.
