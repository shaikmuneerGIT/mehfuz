# Mehfuz — Premium Dry Fruits & Commodities

Full-stack e-commerce app for Mehfuz: a React storefront and an **ASP.NET
Core / C# / MS SQL Server** API, seeded with the Mehfuz product catalog
(Anjeer, dates, nuts, raisins, seeds, dried fruit, saffron, coffee, and
spices), built to deploy on Windows Server hosting.

## Stack

- **api/** — ASP.NET Core 10 Web API (C#), Entity Framework Core, MS SQL
  Server, JWT-authenticated admin endpoints, rate limiting.
- **client/** — React + Vite + TypeScript + Tailwind CSS, React Router,
  storefront + admin dashboard. Unchanged from the original build — it
  only talks to a REST API, so it doesn't care that the backend is C# now.

In production the API also serves the built React app, so the whole shop
runs on **one process, one URL, no CORS to configure**.

## Getting started (local development)

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server (Developer or Express edition — free) running locally, or
  point the connection string at any reachable SQL Server instance
- Node.js 20+ (for the React client)

### 1. API

```powershell
cd api
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "<paste output of: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\">"
dotnet user-secrets set "AdminSeed:Password" "<choose an admin password>"
dotnet ef database update   # applies migrations, creating MehfuzDb
dotnet run                  # starts the API on http://localhost:5000
```

The connection string defaults to `Server=localhost;Database=MehfuzDb;Trusted_Connection=True;`
(Windows Authentication) — see `appsettings.json` to point at a different
server or use SQL auth instead.

On first boot the app automatically applies pending migrations and seeds
the category/product catalog plus the admin user
(`AdminSeed:Email`, default `admin@mehfuzdryfruits.com`). Both are safe to
re-run on every restart — see [Data integrity](#data-integrity).

### 2. Client

```bash
cd client
npm install
npm run dev   # starts the storefront on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`.

Visit `/admin/login` to sign in to the admin dashboard.

## Deploying to Windows Server (Plesk / IIS)

`publish.ps1` at the repo root builds both the client and API into a
single self-contained folder ready to upload:

```powershell
.\publish.ps1
```

This produces `.\publish\` containing the compiled API (bundled with its
own .NET runtime — no dependency on the server having the ASP.NET Core
Hosting Bundle installed), a generated `web.config` wired for IIS's
ASP.NET Core Module, and the built React app under `client-dist\`.

### On the server (Plesk)

1. **Upload**: FTP the *contents* of `.\publish\` (not the folder itself)
   to your domain's `httpdocs` directory (or wherever Plesk's IIS site
   root points).
2. **Database**: In Plesk → your domain → **Databases**, create a new
   **MS SQL Server** database and a user for it. If MS SQL isn't listed
   as an option, ask your host (this needs a Windows hosting plan with
   SQL Server support, not just MySQL).
3. **Configuration**: ASP.NET Core reads configuration from environment
   variables using `__` as the section separator. In Plesk → your domain
   → **Hosting Settings** (or **IIS Web Hosting Settings**), look for
   **.NET / Environment Variables** and set:
   - `ConnectionStrings__Default` — the connection string Plesk shows you
     for the database you just created
   - `Jwt__Secret` — a long random string (generate one the same way as
     in local dev)
   - `AdminSeed__Email` / `AdminSeed__Password` — your real admin login
   - `ClientOrigins` — `https://mehfuzdryfruits.in,https://www.mehfuzdryfruits.in`
   - `UploadDir` — an absolute path outside `httpdocs` if your plan
     resets the web root on redeploy, otherwise a subfolder like
     `uploads` is fine
4. **Application pool**: Plesk's IIS settings need the site's .NET/ASP.NET
   Core support enabled — if you only see classic ASP.NET/.NET Framework
   options, ask HostingRaja support to enable ASP.NET Core hosting (via
   the ASP.NET Core Module) for the site, since Plesk on Windows supports
   this but it isn't always turned on by default per-domain.
5. **First run**: visiting the site triggers the same automatic
   migrate + seed as local dev — no separate step needed.
6. Once DNS for `mehfuzdryfruits.in` points at this server, ask Plesk to
   issue a **Let's Encrypt** certificate from the domain's **SSL/TLS
   Certificates** tab for HTTPS (free, a few clicks).

### Redeploying after changes

Re-run `.\publish.ps1` and re-upload the contents of `.\publish\` — your
data isn't affected since it lives in the SQL Server database, not in
the deployed files (except `UploadDir`, which is why step 3 above
recommends keeping it outside the folder you overwrite on redeploy if
your host wipes `httpdocs` on upload).

## Data integrity

Products and pack sizes that appear in past orders are never hard-deleted,
since that would erase order history. Deleting such a product returns a
409 and the admin UI offers to hide it from the shop instead; removing a
pack size that has been ordered deactivates it instead of removing it.
Anything never ordered deletes outright. Stock is decremented with a
conditional `UPDATE ... WHERE Stock >= @quantity` executed directly
against the database inside the order's transaction (EF Core's
`ExecuteUpdateAsync`), so two simultaneous checkouts can't oversell the
same pack size — verified with concurrent requests against a
single-unit stock.

The database seed only creates products on a fresh database; categories
and the admin account resync on every restart, but re-running the seed
against an already-populated catalog never duplicates products or
overwrites price edits made from the admin panel.

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
  change in `api/Controllers/OrdersController.cs` and
  `client/src/pages/Checkout.tsx`).
- Product imagery: each product has an `ImageUrl`. Upload a photo (or paste
  a URL) from the admin product form; until one is set, the storefront shows
  a hand-drawn illustration matched to the product.
