import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useSupportTools, useSupportScan } from "@/hooks/useApi";

export default function Suporte() {
  const { token } = useAuthLocal();
  const toolsQ = useSupportTools();
  const scanM = useSupportScan();
  const [scanResult, setScanResult] = useState<any>(null);

  const [sessionId] = useState(() => `sess-${Math.random().toString(36).slice(2, 10)}`);
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);

  async function runTool(id: string, args?: any) {
    try {
      const res = await apiFetch<{ ok: boolean; result: any }>("/api/support/tool", { method: "POST", token, body: { id, args } });
      toast.success("Executado");
      if (id === "db_scan") setScanResult(res.result);
      return res;
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function runScan() {
    const res = await scanM.mutateAsync();
    setScanResult(res);
  }

  async function send() {
    const text = msg.trim();
    if (!text) return;
    setMsg("");
    setChat(prev => [...prev, { role: "user", content: text }]);
    try {
      const res = await apiFetch<{ reply: string }>("/api/support/chat", { method: "POST", token, body: { sessionId, message: text } });
      setChat(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setChat(prev => [...prev, { role: "assistant", content: `Erro: ${e.message}` }]);
    }
  }

  const alerts = scanResult?.alerts || [];

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="text-xl font-semibold">Suporte e Agente</div>
        <div className="text-sm text-muted-foreground">Ferramentas operacionais + chat (OpenAI opcional).</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ferramentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runScan} disabled={scanM.isPending}>Varredura do banco</Button>
              <Button variant="outline" onClick={() => runTool("run_checklist", { kind: "open" })}>Checklist abertura</Button>
              <Button variant="outline" onClick={() => runTool("run_checklist", { kind: "close" })}>Checklist fechamento</Button>
              <Button variant="outline" onClick={() => runTool("fix_inconsistencies")}>Corrigir inconsistências</Button>
            </div>

            <div className="text-xs text-muted-foreground">Tools registradas: {(toolsQ.data?.tools || []).map((t: any) => t.id).join(", ") || "-"}</div>

            {scanResult ? (
              <div className="rounded-md border p-3 text-sm space-y-2">
                <div className="font-medium">Contagens</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Mesas: {scanResult.counts?.tables ?? "-"}</div>
                  <div>Reservas: {scanResult.counts?.reservations ?? "-"}</div>
                  <div>Fila: {scanResult.counts?.waitlist ?? "-"}</div>
                  <div>Clientes: {scanResult.counts?.customers ?? "-"}</div>
                </div>
                <div className="font-medium">Alertas</div>
                {alerts.length ? (
                  <ul className="list-disc pl-5 text-xs">
                    {alerts.map((a: any, i: number) => (
                      <li key={i}>{a.message}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground">Nenhum alerta.</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Rode a varredura para ver contagens e alertas.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chat do agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-md border p-2 h-[320px] overflow-auto text-sm space-y-2">
              {chat.map((m, idx) => (
                <div key={idx} className={m.role === "user" ? "text-right" : ""}>
                  <div className="inline-block max-w-[90%] rounded-md border px-2 py-1">
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))}
              {!chat.length ? <div className="text-sm text-muted-foreground">Envie uma mensagem.</div> : null}
            </div>
            <div className="flex gap-2">
              <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ex: rode uma varredura / explique erro..." onKeyDown={e => { if (e.key === "Enter") send(); }} />
              <Button onClick={send}>Enviar</Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Se <span className="font-mono">OPENAI_API_KEY</span> não estiver configurado, o chat responde em modo offline.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
