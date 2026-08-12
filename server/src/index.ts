import { config } from "dotenv";
config({ quiet: true });
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { catalogRouter } from "./routes/catalog";
import { authRouter } from "./routes/auth";
import { ordersRouter } from "./routes/orders";
import { adminRouter } from "./routes/admin";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

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

app.use("/api/catalog", catalogRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Mehfuz API listening on http://localhost:${PORT}`);
});
