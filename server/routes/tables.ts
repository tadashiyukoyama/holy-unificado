import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { and, eq, isNull } from "drizzle-orm";

const TableShape = z.enum(["round", "rect"]);
const TableStatus = z.enum(["available", "blocked", "out_of_service"]);

const TableUpsert = z.object({
  roomId: z.string().uuid().nullable().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  shape: TableShape,
  status: TableStatus,
  isActive: z.boolean().optional(),
  x: z.number().int().min(0).optional(),
  y: z.number().int().min(0).optional(),
  w: z.number().int().min(20).optional(),
  h: z.number().int().min(20).optional(),
  rotation: z.number().int().min(0).max(359).optional(),
  notes: z.string().optional().nullable(),
});

const RoomUpsert = z.object({
  name: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  background: z.string().optional().nullable(),
});

export function tablesRouter() {
  const r = Router();

  r.get("/rooms", async (req, res) => {
    const rooms = await db.select().from(schema.diningRooms).orderBy(schema.diningRooms.name);
    return res.json({ rooms });
  });

  r.post("/rooms", async (req, res) => {
    const body = RoomUpsert.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db.insert(schema.diningRooms).values({
      name: body.data.name,
      width: body.data.width ?? 900,
      height: body.data.height ?? 560,
      background: body.data.background ?? null,
    }).returning();

    return res.json({ room: inserted[0] });
  });

  r.get("/", async (req, res) => {
    const roomId = typeof req.query.roomId === "string" ? req.query.roomId : undefined;
    const rows = await db
      .select()
      .from(schema.tables)
      .where(
        roomId
          ? and(eq(schema.tables.isActive, true), eq(schema.tables.roomId, roomId))
          : eq(schema.tables.isActive, true)
      );

    return res.json({ tables: rows });
  });

  r.post("/", async (req, res) => {
    const body = TableUpsert.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const inserted = await db.insert(schema.tables).values({
      roomId: body.data.roomId ?? null,
      code: body.data.code,
      name: body.data.name,
      capacity: body.data.capacity,
      shape: body.data.shape,
      status: body.data.status,
      isActive: body.data.isActive ?? true,
      x: body.data.x ?? 10,
      y: body.data.y ?? 10,
      w: body.data.w ?? 90,
      h: body.data.h ?? 90,
      rotation: body.data.rotation ?? 0,
      notes: body.data.notes ?? null,
    }).returning();

    return res.json({ table: inserted[0] });
  });

  r.put("/:id", async (req, res) => {
    const id = req.params.id;
    const body = TableUpsert.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db
      .update(schema.tables)
      .set({
        roomId: body.data.roomId ?? null,
        code: body.data.code,
        name: body.data.name,
        capacity: body.data.capacity,
        shape: body.data.shape,
        status: body.data.status,
        isActive: body.data.isActive ?? true,
        x: body.data.x ?? 10,
        y: body.data.y ?? 10,
        w: body.data.w ?? 90,
        h: body.data.h ?? 90,
        rotation: body.data.rotation ?? 0,
        notes: body.data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.tables.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ table: updated[0] });
  });

  r.post("/:id/move", async (req, res) => {
    const id = req.params.id;
    const body = z
      .object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(20),
        h: z.number().int().min(20),
        rotation: z.number().int().min(0).max(359),
      })
      .safeParse(req.body);

    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const updated = await db
      .update(schema.tables)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(schema.tables.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ table: updated[0] });
  });

  r.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const updated = await db
      .update(schema.tables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.tables.id, id))
      .returning();

    if (!updated.length) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true });
  });

  return r;
}
