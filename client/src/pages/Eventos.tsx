import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function Eventos() {
  const { token } = useAuthLocal();
  const eventsQ = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<{ events: any[] }>("/api/events", { token }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", eventDate: "", notes: "" });

  async function create() {
    try {
      await apiFetch("/api/events", { method: "POST", token, body: { ...form, notes: form.notes || null } });
      toast.success("Evento criado");
      setOpen(false);
      setForm({ title: "", eventDate: "", notes: "" });
      eventsQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Eventos</div>
          <div className="text-sm text-muted-foreground">Eventos do restaurante.</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!form.title.trim() || !form.eventDate}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(eventsQ.data?.events || []).map((e: any) => (
            <div key={e.id} className="rounded-md border p-2">
              <div className="font-medium">{e.eventDate} • {e.title}</div>
              {e.notes ? <div className="text-xs text-muted-foreground">{e.notes}</div> : null}
            </div>
          ))}
          {eventsQ.isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
