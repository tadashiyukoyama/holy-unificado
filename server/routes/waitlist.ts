import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

const WaitlistStatus = z.enum(["waiting", "contacted", "seated", "cancelled"]);

const WaitlistCreate = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional().nullable(),
  partySize: z.number().int().positive(),
  status: WaitlistStatus.optional(),
  notes: z.string().optional().nullable(),
});

const WaitlistUpdate = WaitlistCreate.partial();

export function waitlistRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    const rows = await db
      .select()
      .from(schema.waitlist)
      .orderBy(schema.waitlist.createdAt);

    return res.json({ waitlist: rows });
  });

  r.post("/", async (req, res) => {
    const body = WaitlistCreate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db
      .insert(schema.waitlist)
      .values({
        customerName: body.data.customerName,
        customerPhone: body.data.customerPhone ?? null,
        partySize: body.data.partySize,
        status: body.data.status ?? "waiting",
        notes: body.data.notes ?? null,
      })
      .returning();

    return res.json({ entry: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = WaitlistUpdate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db
      .update(schema.waitlist)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(schema.waitlist.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ entry: updated[0] });
  });

  r.post("/:id/cancel", async (req, res) => {
    const id = req.params.id;
    const updated = await db
      .update(schema.waitlist)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.waitlist.id, id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ entry: updated[0] });
  });

  return r;
}
