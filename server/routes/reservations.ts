import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const ReservationStatus = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]);

const ReservationCreate = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional().nullable(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservationTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  partySize: z.number().int().positive(),
  status: ReservationStatus.optional(),
  tableId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.enum(["manual", "waitlist", "whatsapp", "web"]).optional(),
});

const ReservationUpdate = ReservationCreate.partial().extend({
  status: ReservationStatus.optional(),
});

export function reservationsRouter() {
  const r = Router();

  r.get("/", async (req, res) => {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const rows = date
      ? await db
          .select()
          .from(schema.reservations)
          .where(eq(schema.reservations.reservationDate, date))
          .orderBy(schema.reservations.reservationTime)
      : await db.select().from(schema.reservations).orderBy(schema.reservations.createdAt);

    return res.json({ reservations: rows });
  });

  r.post("/", async (req, res) => {
    const body = ReservationCreate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const code = `R-${nanoid(6).toUpperCase()}`;
    const inserted = await db
      .insert(schema.reservations)
      .values({
        code,
        customerName: body.data.customerName,
        customerPhone: body.data.customerPhone ?? null,
        reservationDate: body.data.reservationDate,
        reservationTime: body.data.reservationTime.slice(0, 5),
        partySize: body.data.partySize,
        status: body.data.status ?? "pending",
        tableId: body.data.tableId ?? null,
        notes: body.data.notes ?? null,
        source: body.data.source ?? "manual",
      })
      .returning();

    return res.json({ reservation: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = ReservationUpdate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db
      .update(schema.reservations)
      .set({ ...body.data, reservationTime: body.data.reservationTime?.slice(0, 5), updatedAt: new Date() })
      .where(eq(schema.reservations.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ reservation: updated[0] });
  });

  r.post("/:id/cancel", async (req, res) => {
    const id = req.params.id;
    const updated = await db
      .update(schema.reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.reservations.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ reservation: updated[0] });
  });

  return r;
}
