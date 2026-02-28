import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

const CouponCreate = z.object({
  code: z.string().min(2),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

const CouponUpdate = CouponCreate.partial();

export function couponsRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    const rows = await db.select().from(schema.coupons).orderBy(schema.coupons.createdAt);
    return res.json({ coupons: rows });
  });

  r.post("/", async (req, res) => {
    const body = CouponCreate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db.insert(schema.coupons).values({
      code: body.data.code.toUpperCase(),
      description: body.data.description ?? null,
      active: body.data.active ?? true,
    }).returning();

    return res.json({ coupon: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = CouponUpdate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db.update(schema.coupons).set({ ...body.data, updatedAt: new Date() }).where(eq(schema.coupons.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ coupon: updated[0] });
  });

  return r;
}
