import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { and, eq, inArray } from "drizzle-orm";

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(v => Number.parseInt(v, 10));
  return h * 60 + m;
}

async function getAvgMinutes() {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, "tempo_medio_mesa")).limit(1);
  const n = rows.length ? Number.parseInt(rows[0].value || "", 10) : 60;
  return Number.isFinite(n) && n > 0 ? n : 60;
}

export function occupancyRouter() {
  const r = Router();

  r.get("/", async (req, res) => {
    const q = z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        roomId: z.string().uuid().optional(),
      })
      .safeParse(req.query);

    if (!q.success) return res.status(400).json({ error: "invalid_query", issues: q.error.issues });

    const avg = await getAvgMinutes();
    const selectedMin = toMin(q.data.time);

    const tables = await db
      .select()
      .from(schema.tables)
      .where(q.data.roomId ? and(eq(schema.tables.isActive, true), eq(schema.tables.roomId, q.data.roomId)) : eq(schema.tables.isActive, true));

    const reservations = await db
      .select()
      .from(schema.reservations)
      .where(and(eq(schema.reservations.reservationDate, q.data.date), inArray(schema.reservations.status, ["pending", "confirmed"])));

    const resByTable = new Map<string, typeof reservations>();
    for (const rsv of reservations) {
      if (!rsv.tableId) continue;
      const arr = resByTable.get(rsv.tableId) || [];
      arr.push(rsv);
      resByTable.set(rsv.tableId, arr);
    }

    const result = tables.map(t => {
      const list = resByTable.get(t.id) || [];
      const active = list.find(rsv => {
        const start = toMin(rsv.reservationTime as unknown as string);
        const end = start + avg;
        return selectedMin >= start && selectedMin < end;
      });

      let effectiveStatus: string = t.status;
      let reason: string = "manual";
      if (t.status === "available" && active) {
        effectiveStatus = "occupied";
        reason = "reservation";
      }
      return {
        id: t.id,
        effective_status: effectiveStatus,
        reason,
        active_reservation: active
          ? {
              id: active.id,
              code: active.code,
              customer_name: active.customerName,
              reservation_time: active.reservationTime,
              party_size: active.partySize,
              status: active.status,
            }
          : null,
      };
    });

    return res.json({ tables: result });
  });

  return r;
}
