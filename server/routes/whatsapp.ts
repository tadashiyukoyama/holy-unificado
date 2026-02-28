import { Router } from "express";

export function whatsappRouter() {
  const r = Router();

  r.get("/status", async (_req, res) => {
    const enabled = process.env.WHATSAPP_ENABLED === "true";
    return res.json({
      enabled,
      mode: process.env.WHATSAPP_MODE || "disabled",
      message: enabled ? "WhatsApp module enabled (pending implementation)." : "WhatsApp disabled (Meta review pending).",
    });
  });

  r.post("/send-test", async (_req, res) => {
    return res.status(501).json({ error: "not_implemented", message: "WhatsApp Cloud API pending. Configure WHATSAPP_* vars." });
  });

  return r;
}
