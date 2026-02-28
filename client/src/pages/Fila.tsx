import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useWaitlist } from "@/hooks/useApi";

export default function Fila() {
  const { token } = useAuthLocal();
  const q = useWaitlist();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", partySize: 2, notes: "" });

  async function create() {
    try {
      await apiFetch("/api/waitlist", { method: "POST", token, body: { ...form, partySize: Number(form.partySize) } });
      toast.success("Adicionado");
      setOpen(false);
      setForm({ customerName: "", customerPhone: "", partySize: 2, notes: "" });
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await apiFetch(`/api/waitlist/${id}`, { method: "PUT", token, body: { status } });
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function cancel(id: string) {
    try {
      await apiFetch(`/api/waitlist/${id}/cancel`, { method: "POST", token });
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Fila de espera</div>
          <div className="text-sm text-muted-foreground">Arraste clientes para uma mesa em Mesas.</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cliente na fila</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Nome</Label>
                <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
              </div>
              <div>
                <Label>Pessoas</Label>
                <Input type="number" value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!form.customerName.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista ({q.data?.waitlist?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(q.data?.waitlist || []).map((w: any) => (
            <div key={w.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {w.customerName} ({w.partySize}p)
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {w.status} {w.customerPhone ? `• ${w.customerPhone}` : ""} {w.notes ? `• ${w.notes}` : ""}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {w.status !== "cancelled" && w.status !== "seated" ? (
                  <>
                    <Button variant="outline" onClick={() => setStatus(w.id, "contacted")}>
                      Contatado
                    </Button>
                    <Button variant="outline" onClick={() => cancel(w.id)}>
                      Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {q.isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
