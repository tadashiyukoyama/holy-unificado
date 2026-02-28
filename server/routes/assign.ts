import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

const AssignBody = z.object({
  source_type: z.enum(["waitlist", "reservation"]),
  source_id: z.string().uuid(),
  table_id: z.string().uuid(),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservation_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export function assignRouter() {
  const r = Router();

  r.post("/table", async (req, res) => {
    const body = AssignBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const table = await db.select().from(schema.tables).where(eq(schema.tables.id, body.data.table_id)).limit(1);
    if (!table.length) return res.status(404).json({ error: "table_not_found" });

    if (body.data.source_type === "waitlist") {
      const entry = await db.select().from(schema.waitlist).where(eq(schema.waitlist.id, body.data.source_id)).limit(1);
      if (!entry.length) return res.status(404).json({ error: "waitlist_not_found" });

      // create reservation
      const code = `R-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const inserted = await db
        .insert(schema.reservations)
        .values({
          code,
          customerName: entry[0].customerName,
          customerPhone: entry[0].customerPhone,
          reservationDate: body.data.reservation_date,
          reservationTime: body.data.reservation_time,
          partySize: entry[0].partySize,
          status: "confirmed",
          tableId: body.data.table_id,
          notes: entry[0].notes,
          source: "waitlist",
        })
        .returning();

      await db.update(schema.waitlist).set({ status: "seated", updatedAt: new Date() }).where(eq(schema.waitlist.id, entry[0].id));

      return res.json({ ok: true, reservation: inserted[0] });
    }

    // reservation
    const rsv = await db.select().from(schema.reservations).where(eq(schema.reservations.id, body.data.source_id)).limit(1);
    if (!rsv.length) return res.status(404).json({ error: "reservation_not_found" });

    const updated = await db
      .update(schema.reservations)
      .set({
        tableId: body.data.table_id,
        reservationDate: body.data.reservation_date,
        reservationTime: body.data.reservation_time,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(schema.reservations.id, rsv[0].id))
      .returning();

    return res.json({ ok: true, reservation: updated[0] });
  });

  return r;
}
