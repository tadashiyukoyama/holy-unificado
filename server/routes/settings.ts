import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export function settingsRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    const rows = await db.select().from(schema.settings);
    return res.json({
      settings: Object.fromEntries(rows.map(r => [r.key, r.value ?? ""])),
    });
  });

  r.post("/", async (req, res) => {
    const body = z.record(z.string(), z.string().optional()).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body" });

    const entries = Object.entries(body.data);
    for (const [key, value] of entries) {
      await db
        .insert(schema.settings)
        .values({ key, value: value ?? "", updatedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value: value ?? "", updatedAt: new Date() },
        });
    }
    return res.json({ ok: true });
  });

  return r;
}
