import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function healthRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    try {
      const [[row]] = await db.execute(sql`select 1 as ok`);
      return res.json({ ok: true, db: row.ok === 1, time: new Date().toISOString() });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "db_error", time: new Date().toISOString() });
    }
  });

  return r;
}
