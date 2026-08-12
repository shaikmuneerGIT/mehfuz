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
cp .env.example .env     # then edit it — JWT_SECRET is required to boot
npx prisma migrate dev   # creates dev.db and applies schema
npx prisma db seed       # seeds categories, products, and the admin user
npm run dev              # starts the API on http://localhost:4000
```

Admin login credentials are set in `server/.env` (`ADMIN_EMAIL` /
`ADMIN_PASSWORD`, defaults to `admin@mehfuzdryfruits.com` /
`Mehfuz@Admin123`). **Change these before deploying**, and set
`TRUST_PROXY=true` if the API runs behind a reverse proxy so rate
limiting sees real client IPs.

### 2. Frontend

```bash
cd client
npm install
npm run dev               # starts the storefront on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so
run both servers together during development. For a production build where
the API lives on a different origin, set `VITE_API_URL` (e.g.
`VITE_API_URL=https://api.example.com/api`) before `npm run build`.

Visit `/admin/login` to sign in to the admin dashboard (manage products,
pack sizes/pricing, and order status).

## Deploying

In production the Express server also serves the built React app, so the
whole shop runs on **one URL with no CORS to configure**, regardless of
which of the two paths below you use.

### Option A: a VPS (e.g. Hostinger), with Docker — cheapest to run

Everything needed is in `Dockerfile`, `docker-compose.yml`, and `deploy/`.

1. **Buy a VPS.** Any Ubuntu 22.04/24.04 VPS works — Hostinger's cheapest
   VPS plan is a common India-friendly choice, and you can buy your domain
   from the same account. Note the server's public IP and root password.
2. **SSH in** (`ssh root@<server-ip>`) and run the bootstrap script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/shaikmuneerGIT/mehfuz/main/deploy/bootstrap-vps.sh -o bootstrap.sh
   bash bootstrap.sh https://github.com/shaikmuneerGIT/mehfuz.git
   ```
   This installs Docker, nginx, and a firewall, clones the repo to
   `/opt/mehfuz`, and points nginx at the app.
3. **Configure secrets:**
   ```bash
   cd /opt/mehfuz
   cp .env.production.example .env
   nano .env   # set JWT_SECRET (openssl rand -hex 48), ADMIN_EMAIL, ADMIN_PASSWORD
   ```
4. **Deploy:** `./deploy/deploy.sh`. Visit `http://<server-ip>` — the shop
   should be live. Redeploying later after a `git push` is the same one
   command.
5. **Point your domain at it.** At your domain registrar's DNS settings,
   add an **A record**: host `@` (and another for `www`) → the server's IP.
   DNS changes can take up to a few hours to propagate.
6. **Add HTTPS**, once DNS has propagated:
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d mehfuz.com -d www.mehfuz.com
   ```
   Certbot edits the nginx config and sets up auto-renewal for you. Update
   `CLIENT_ORIGIN` in `.env` to `https://mehfuz.com,https://www.mehfuz.com`
   and re-run `./deploy/deploy.sh`.

The database and uploaded photos live in a named Docker volume
(`mehfuz-data`), so they survive rebuilds and redeploys — only
`docker compose down -v` (note the `-v`) would ever remove them.

### Option B: Render — more managed, costs more

`render.yaml` in the repo root defines this as a Render Blueprint.

1. In the Render dashboard: **New → Blueprint**, connect this GitHub repo.
2. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` when prompted (`JWT_SECRET` is
   generated for you).
3. Deploy. Render installs, builds, migrates, and seeds automatically.
4. Live at the `.onrender.com` URL Render assigns; add a custom domain
   later from the service's Settings tab.

Requires the `starter` plan (~$7.25/mo total with the disk) — Render's free
tier can't mount a persistent disk, so the database and photos would be
wiped on every deploy.

## Data integrity

Products and pack sizes that appear in past orders are never hard-deleted,
since that would erase order history. Deleting such a product returns a 409
and the admin UI offers to hide it from the shop instead; removing a pack
size that has been ordered deactivates it. Anything never ordered deletes
outright. Stock is decremented under a conditional update inside the order
transaction, so simultaneous checkouts cannot oversell.

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
- Product imagery: each product has an `imageUrl`. Upload a photo (or paste
  a URL) from the admin product form; until one is set, the storefront shows
  a hand-drawn illustration matched to the product.
