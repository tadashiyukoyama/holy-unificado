import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { ilike, or, eq } from "drizzle-orm";

const CustomerCreate = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const CustomerUpdate = CustomerCreate.partial();

export function customersRouter() {
  const r = Router();

  r.get("/", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const rows = q
      ? await db
          .select()
          .from(schema.customers)
          .where(
            or(
              ilike(schema.customers.name, `%${q}%`),
              ilike(schema.customers.phone, `%${q}%`),
              ilike(schema.customers.notes, `%${q}%`)
            )
          )
          .orderBy(schema.customers.name)
      : await db.select().from(schema.customers).orderBy(schema.customers.name);

    return res.json({ customers: rows });
  });

  r.post("/", async (req, res) => {
    const body = CustomerCreate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db
      .insert(schema.customers)
      .values({ name: body.data.name, phone: body.data.phone ?? null, notes: body.data.notes ?? null })
      .returning();

    return res.json({ customer: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = CustomerUpdate.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db
      .update(schema.customers)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(schema.customers.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ customer: updated[0] });
  });

  return r;
}
