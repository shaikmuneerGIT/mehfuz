
import { config } from "dotenv";
config({ quiet: true });
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { catalogRouter } from "./routes/catalog";
import { authRouter } from "./routes/auth";
import { ordersRouter } from "./routes/orders";
import { adminRouter } from "./routes/admin";
import { uploadsRouter, UPLOAD_DIR } from "./routes/uploads";
import { chatRouter } from "./routes/chat";
import { payuRouter } from "./routes/payu";
import { errorHandler } from "./middleware/errors";

if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET is not set. Copy server/.env.example to server/.env and set a strong secret."
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Behind a reverse proxy (nginx, Render, Railway…) the client IP arrives in
// X-Forwarded-For; without this the rate limiter sees every request as one IP.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*",
  })
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "mehfuz-api" }));

// Direct-UPI payment settings. When UPI_ID is unset the checkout shows COD
// only, so deploying without configuring UPI changes nothing for customers.
app.get("/api/config/upi", (_req, res) => {
  const upiId = process.env.UPI_ID ?? null;
  // Shown on screen instead of the raw number: XXXXXXX992@ybl
  const masked = upiId
    ? upiId.replace(/^(.*)(.{3})@/, (_m, head: string, tail: string) => "X".repeat(head.length) + tail + "@")
    : null;
  res.json({
    enabled: Boolean(upiId),
    upiId,
    upiIdMasked: masked,
    payeeName: process.env.UPI_PAYEE_NAME ?? "Mehfuz Dry Fruits",
  });
});

// Whether the AI assistant is available (key configured server-side).
app.get("/api/config/chat", (_req, res) =>
  res.json({ aiEnabled: Boolean(process.env.ANTHROPIC_API_KEY) })
);

// Delivery quote for the storefront: pass ?subtotal=&pincode= to price a
// cart. The same function prices the real order server-side at checkout.
app.get("/api/config/shop", async (req, res) => {
  const { loadShippingConfig, quoteShipping } = await import("./lib/shipping");
  const config = await loadShippingConfig();
  const subtotal = Number(req.query.subtotal ?? 0) || 0;
  const weightKg = Number(req.query.weightKg ?? 0) || 0;
  const quote = quoteShipping(config, subtotal, String(req.query.pincode ?? ""), weightKg);
  res.json({
    shippingEnabled: config.enabled,
    freeAbove: config.freeAbove,
    upto500gFee: config.upto500gFee,
    upto1kgFee: config.upto1kgFee,
    midPerKgFee: config.midPerKgFee,
    bulkPerKgFee: config.bulkPerKgFee,
    quote,
  });
});

// Online payment (PayU hosted checkout) availability.
app.get("/api/config/payu", (_req, res) =>
  res.json({ enabled: Boolean(process.env.PAYU_KEY && process.env.PAYU_SALT) })
);

// Admin-managed hero slideshow content; null means "use the built-in slides".
app.get("/api/config/hero-slides", async (_req, res) => {
  const { prisma } = await import("./lib/prisma");
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "heroSlides" } });
    res.json({ slides: setting ? JSON.parse(setting.value) : null });
  } catch {
    res.json({ slides: null });
  }
});

// Uploaded product photos. crossOriginResourcePolicy is relaxed so the
// storefront can render them when it runs on a different origin.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "7d",
    setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  })
);

app.use("/api/catalog", catalogRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/payu", payuRouter);

// Short order link for emails and messages: /o/MFZ26081234 opens the
// customer's order page.
app.get("/o/:orderNumber", (req, res) => {
  const num = String(req.params.orderNumber).toUpperCase();
  if (!/^MFZ\d{4,}$/.test(num)) return res.redirect("/");
  res.redirect(`/order-confirmed/${num}`);
});

// Unmatched API routes are a 404 regardless of the storefront below.
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// In production this process also serves the built React app, so the whole
// shop runs on a single origin with no CORS and no separate deployment.
const CLIENT_DIST =
  process.env.CLIENT_DIST ?? path.resolve(__dirname, "../../client/dist");

if (fs.existsSync(path.join(CLIENT_DIST, "index.html"))) {
  // Hashed asset filenames are safe to cache hard; index.html must not be,
  // or browsers keep loading the previous release after a deploy.
  app.use(
    express.static(CLIENT_DIST, {
      maxAge: "1y",
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
      },
    })
  );

  // Client-side routes (/shop, /admin/…) must return index.html so a direct
  // visit or refresh doesn't 404.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
  console.log(`Serving storefront from ${CLIENT_DIST}`);
} else {
  console.log("No client build found — running API only (use the Vite dev server).");
}

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);

// The production host can't run `prisma migrate deploy` (no shell access),
// so tables added after the initial deploy are created here at boot. Each
// statement is IF NOT EXISTS, matching the SQL in prisma/migrations, so
// this is a no-op on databases that are already up to date.
async function ensureNewTables() {
  const { prisma } = await import("./lib/prisma");
  const statements = [
    `CREATE TABLE IF NOT EXISTS "StockReceipt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "supplierName" TEXT,
      "notes" TEXT,
      "totalCostInr" INTEGER NOT NULL,
      "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StockReceipt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "StockReceiptItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "receiptId" TEXT NOT NULL,
      "variantId" TEXT NOT NULL,
      "labelSnapshot" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      CONSTRAINT "StockReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "StockReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StockReceiptItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "StockAdjustment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "variantId" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StockAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Setting" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "category" TEXT,
      "notes" TEXT,
      "amountInr" INTEGER NOT NULL,
      "incurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }

  // SQLite has no ADD COLUMN IF NOT EXISTS — a failure here just means the
  // column already exists, so each one is attempted independently.
  const columnAdds = [
    `ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN "paymentRef" TEXT`,
    `ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT`,
    `ALTER TABLE "Category" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Product" ADD COLUMN "stockGrams" INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const sql of columnAdds) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      /* column already exists */
    }
  }

  // One-shot rename of the admin login to the site's real domain. The guard
  // makes it a no-op once renamed (or if the new email already exists).
  await prisma.$executeRawUnsafe(
    `UPDATE "AdminUser" SET email = 'admin@mehfuzdryfruits.in'
     WHERE email = 'admin@mehfuzdryfruits.com'
       AND NOT EXISTS (SELECT 1 FROM "AdminUser" WHERE email = 'admin@mehfuzdryfruits.in')`
  );
}

/**
 * Stock is held as bulk weight, because this shop cuts pack sizes from the
 * same sack: 2 kg of almonds is two 1kg packs OR four 500g OR eight 250g, and
 * selling two 500g packs leaves 1 kg — not "2 kg with a phantom opening
 * balance", which is what per-pack counting produced.
 *
 * The one-off conversion recomputes each product's weight from the records
 * that are real — deliveries received minus packs sold — deliberately
 * discarding the per-pack opening balances, since those existed only to
 * explain sales that per-pack counting could not take from a larger pack.
 */
async function backfillStockGrams() {
  const { prisma } = await import("./lib/prisma");
  const { packGrams, syncVariantStock } = await import("./lib/stock");
  const KEY = "stockGramsBackfilled";

  if (await prisma.setting.findUnique({ where: { key: KEY } })) return;

  const variants = await prisma.variant.findMany({
    select: { id: true, label: true, productId: true },
  });
  const [receipts, sales] = await Promise.all([
    prisma.stockReceiptItem.groupBy({ by: ["variantId"], _sum: { quantity: true } }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: { order: { status: { not: "CANCELLED" } } },
    }),
  ]);
  const received = new Map(receipts.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  const sold = new Map(sales.map((r) => [r.variantId, r._sum.quantity ?? 0]));

  const gramsByProduct = new Map<string, number>();
  for (const v of variants) {
    const g = packGrams(v.label);
    const net = (received.get(v.id) ?? 0) * g - (sold.get(v.id) ?? 0) * g;
    gramsByProduct.set(v.productId, (gramsByProduct.get(v.productId) ?? 0) + net);
  }

  await prisma.$transaction(
    [...gramsByProduct.entries()].map(([id, grams]) =>
      prisma.product.update({ where: { id }, data: { stockGrams: Math.max(0, grams) } })
    )
  );
  await syncVariantStock([...gramsByProduct.keys()]);
  await prisma.setting.create({ data: { key: KEY, value: new Date().toISOString() } });
  console.log(`Stock converted to weight for ${gramsByProduct.size} product(s).`);
}

ensureNewTables()
  .then(backfillStockGrams)
  .catch((err) => console.error("Table ensure failed:", err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Mehfuz API listening on http://localhost:${PORT}`);
    });
  });
