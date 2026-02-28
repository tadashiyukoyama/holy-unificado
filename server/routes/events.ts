import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

const EventCreate = z.object({
  title: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
});

const EventUpdate = EventCreate.partial();

export function eventsRouter() {
  const r = Router();

  r.get("/", async (_req, res) => {
    const rows = await db.select().from(schema.restaurantEvents).orderBy(schema.restaurantEvents.eventDate);
    return res.json({ events: rows });
  });

  r.post("/", async (req, res) => {
    const body = EventCreate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db.insert(schema.restaurantEvents).values({
      title: body.data.title,
      eventDate: body.data.eventDate,
      notes: body.data.notes ?? null,
    }).returning();

    return res.json({ event: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = EventUpdate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db.update(schema.restaurantEvents).set({ ...body.data, updatedAt: new Date() }).where(eq(schema.restaurantEvents.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ event: updated[0] });
  });

  r.delete("/:id", async (req, res) => {
    const id = req.params.id;
    await db.delete(schema.restaurantEvents).where(eq(schema.restaurantEvents.id, id));
    return res.json({ ok: true });
  });

  return r;
}
