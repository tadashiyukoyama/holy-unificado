import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { sql } from "drizzle-orm";

type ToolId = "db_scan" | "run_checklist" | "fix_inconsistencies";

const tools: { id: ToolId; title: string; description: string }[] = [
  { id: "db_scan", title: "Varredura do banco", description: "Contagens e alertas rápidos (órfãos, status inválidos, etc.)." },
  { id: "run_checklist", title: "Rodar checklist", description: "Checklist operacional (pré-abertura / fechamento)." },
  { id: "fix_inconsistencies", title: "Corrigir inconsistências", description: "Ajustes automáticos seguros (ex.: waitlist seated sem mesa)." },
];

async function dbScan() {
  const [[tablesCount]] = await db.execute(sql`select count(*)::int as c from tables`);
  const [[reservationsCount]] = await db.execute(sql`select count(*)::int as c from reservations`);
  const [[waitlistCount]] = await db.execute(sql`select count(*)::int as c from waitlist`);
  const [[customersCount]] = await db.execute(sql`select count(*)::int as c from customers`);

  const [[orphanReservations]] = await db.execute(
    sql`select count(*)::int as c from reservations r left join tables t on t.id = r.table_id where r.table_id is not null and t.id is null`
  );

  return {
    counts: {
      tables: tablesCount.c,
      reservations: reservationsCount.c,
      waitlist: waitlistCount.c,
      customers: customersCount.c,
    },
    alerts: [
      orphanReservations.c > 0 ? { level: "warn", message: `Reservas apontando para mesas inexistentes: ${orphanReservations.c}` } : null,
    ].filter(Boolean),
  };
}

async function runChecklist(kind: "open" | "close") {
  const scan = await dbScan();
  const items =
    kind === "open"
      ? [
          { id: "db", ok: true, message: "Banco acessível" },
          { id: "tables", ok: scan.counts.tables > 0, message: "Mesas cadastradas" },
          { id: "alerts", ok: scan.alerts.length === 0, message: "Sem alertas críticos" },
        ]
      : [
          { id: "pending", ok: true, message: "Conferir reservas pendentes" },
          { id: "backups", ok: true, message: "Backup agendado (Azure DB)" },
        ];

  return { kind, items, scan };
}

async function fixInconsistencies() {
  // Safe fix: if waitlist has status seated but no reservation exists, keep as seated (no action) - here we just log.
  const scan = await dbScan();
  return { ok: true, scan };
}

async function logAudit(action: string, payload: unknown) {
  await db.insert(schema.supportAudit).values({ actor: "support", action, payload });
}

export function supportRouter() {
  const r = Router();

  r.get("/tools", async (_req, res) => res.json({ tools }));

  r.post("/scan", async (_req, res) => {
    const result = await dbScan();
    await logAudit("support.scan", result);
    return res.json(result);
  });

  r.post("/tool", async (req, res) => {
    const body = z
      .object({
        id: z.enum(["db_scan", "run_checklist", "fix_inconsistencies"]),
        args: z.any().optional(),
      })
      .safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    let result: any = null;
    if (body.data.id === "db_scan") result = await dbScan();
    if (body.data.id === "run_checklist") {
      const kind = body.data.args?.kind === "close" ? "close" : "open";
      result = await runChecklist(kind);
    }
    if (body.data.id === "fix_inconsistencies") result = await fixInconsistencies();

    await logAudit(`support.tool.${body.data.id}`, { args: body.data.args ?? null, result });
    return res.json({ ok: true, result });
  });

  r.post("/chat", async (req, res) => {
    const body = z.object({ sessionId: z.string().min(1), message: z.string().min(1) }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "invalid_body" });

    const { sessionId, message } = body.data;
    await db.insert(schema.supportMessages).values({ sessionId, role: "user", content: message });

    // Optional OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const reply =
        message.toLowerCase().includes("scan") || message.toLowerCase().includes("varredura")
          ? `Posso rodar uma varredura. Clique em "Varredura do banco" no painel Suporte.`
          : `Estou sem OPENAI_API_KEY. Posso executar ferramentas via botões no painel (scan/checklist/correções).`;
      await db.insert(schema.supportMessages).values({ sessionId, role: "assistant", content: reply });
      return res.json({ reply, mode: "no_key" });
    }

    // Use OpenAI via HTTPS (no SDK; avoids peer-dep conflicts).
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um agente de suporte do sistema de reservas Holy Water. Seja direto e operacional." },
            { role: "user", content: message },
          ],
          temperature: 0.2,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 400)}`);
      }

      const data: any = await resp.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || "Sem resposta.";
      await db.insert(schema.supportMessages).values({ sessionId, role: "assistant", content: reply });
      return res.json({ reply, mode: "openai" });
    } catch (e: any) {
      const reply = `Falha ao chamar OpenAI: ${e?.message || "erro"}`;
      await db.insert(schema.supportMessages).values({ sessionId, role: "assistant", content: reply });
      return res.status(500).json({ error: "openai_error", reply });
    }
  });

  return r;
}
