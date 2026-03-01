import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function healthRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    try {
      // Não tenta ler retorno. Só valida que o DB responde.
      await db.execute(sql`select 1`);
      return res.json({ ok: true, db: true, time: new Date().toISOString() });
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, db: false, error: e?.message || "db_error", time: new Date().toISOString() });
    }
  });

  return r;
}