import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function healthRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    try {
      const result: any = await db.execute(sql`select 1 as ok`);

      // Drizzle (node-postgres) normalmente retorna { rows: [...] }
      const row =
        (result?.rows && result.rows[0]) ||
        (Array.isArray(result) ? result[0] : null) ||
        (Array.isArray(result?.[0]) ? result[0][0] : null);

      const dbOk = row?.ok === 1 || row?.ok === true || row?.ok === "1";
      return res.json({ ok: true, db: dbOk, time: new Date().toISOString() });
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, error: e?.message || "db_error", time: new Date().toISOString() });
    }
  });

  return r;
}
