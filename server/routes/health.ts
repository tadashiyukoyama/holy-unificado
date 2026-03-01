import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

function pickFirstRow(result: any) {
  // Drizzle + node-postgres usually: { rows: [...] }
  if (result?.rows && Array.isArray(result.rows)) return result.rows[0] ?? null;
  // Some drivers may return an array
  if (Array.isArray(result)) return result[0] ?? null;
  // Worst case: nested arrays
  if (Array.isArray(result?.[0])) return result[0][0] ?? null;
  return null;
}

export function healthRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    try {
      const result: any = await db.execute(sql`select 1 as ok`);
      const row = pickFirstRow(result);
      const dbOk = row?.ok === 1 || row?.ok === true || row?.ok === "1";
      return res.json({ ok: true, db: !!dbOk, time: new Date().toISOString() });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "db_error", time: new Date().toISOString() });
    }
  });

  return r;
}