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

app.listen(PORT, () => {
  console.log(`Mehfuz API listening on http://localhost:${PORT}`);
});
