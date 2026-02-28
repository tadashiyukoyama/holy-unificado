import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupVite, serveStatic } from "./vite";
import { getEnv } from "./env";
import { runMigrationsIfEnabled } from "../db/migrate";
import { ensureAdminUser } from "../auth/seed";
import { healthRouter } from "../routes/health";
import { authRouter } from "../routes/auth";
import { authMiddleware } from "../auth/middleware";
import { tablesRouter } from "../routes/tables";
import { reservationsRouter } from "../routes/reservations";
import { waitlistRouter } from "../routes/waitlist";
import { customersRouter } from "../routes/customers";
import { settingsRouter } from "../routes/settings";
import { occupancyRouter } from "../routes/occupancy";
import { assignRouter } from "../routes/assign";
import { supportRouter } from "../routes/support";
import { eventsRouter } from "../routes/events";
import { couponsRouter } from "../routes/coupons";
import { whatsappRouter } from "../routes/whatsapp";

const env = getEnv();
const app = express();
app.use(express.json({ limit: "2mb" }));

const server = createServer(app);
const io = new SocketIOServer(server, { cors: { origin: true } });

// basic realtime: broadcast on demand
export function emitEvent(event: string, payload: any) {
  io.emit(event, payload);
}

// Public
app.use("/api/health", healthRouter());
app.use("/api/auth", authRouter(env.JWT_SECRET));

// Protected (everything else)
app.use("/api", authMiddleware(env.JWT_SECRET));
app.use("/api/tables", tablesRouter());
app.use("/api/reservations", reservationsRouter());
app.use("/api/waitlist", waitlistRouter());
app.use("/api/customers", customersRouter());
app.use("/api/settings", settingsRouter());
app.use("/api/occupancy", occupancyRouter());
app.use("/api/assign", assignRouter());
app.use("/api/support", supportRouter());
app.use("/api/events", eventsRouter());
app.use("/api/coupons", couponsRouter());
app.use("/api/whatsapp", whatsappRouter());

app.get("/api/version", (_req, res) => {
  res.json({ name: "holywater-reservas-azure", build: process.env.BUILD_TAG || "dev" });
});

(async () => {
  try {
    await runMigrationsIfEnabled();
    await ensureAdminUser();
  } catch (e) {
    // If DB is down, don't crash hard in dev; in prod you want to fail fast.
    console.error("Startup DB step failed:", e);
  }

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Holy Water app listening on http://localhost:${port}`);
  });
})();
