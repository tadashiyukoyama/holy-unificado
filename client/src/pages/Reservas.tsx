import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useReservations, useTables } from "@/hooks/useApi";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Reservas() {
  const { token } = useAuthLocal();
  const [date, setDate] = useState(todayISO());
  const resQ = useReservations(date);
  const tablesQ = useTables();

  const tableNameById = useMemo(() => new Map((tablesQ.data?.tables || []).map((t: any) => [t.id, t.name])), [tablesQ.data]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    reservationTime: "20:00",
    partySize: 2,
    tableId: "",
    notes: "",
  });

  async function create() {
    try {
      await apiFetch("/api/reservations", {
        method: "POST",
        token,
        body: {
          customerName: form.customerName,
          customerPhone: form.customerPhone || null,
          reservationDate: date,
          reservationTime: form.reservationTime,
          partySize: Number(form.partySize),
          tableId: form.tableId || null,
          notes: form.notes || null,
          status: form.tableId ? "confirmed" : "pending",
        },
      });
      toast.success("Reserva criada");
      setOpen(false);
      setForm({ customerName: "", customerPhone: "", reservationTime: "20:00", partySize: 2, tableId: "", notes: "" });
      resQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function cancel(id: string) {
    try {
      await apiFetch(`/api/reservations/${id}/cancel`, { method: "POST", token });
      toast.success("Cancelada");
      resQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Reservas</div>
          <div className="text-sm text-muted-foreground">Criação e lista por data.</div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Criar reserva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova reserva</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label>Cliente</Label>
                  <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Telefone</Label>
                  <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input type="time" value={form.reservationTime} onChange={e => setForm(f => ({ ...f, reservationTime: e.target.value }))} />
                </div>
                <div>
                  <Label>Pessoas</Label>
                  <Input type="number" value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: Number(e.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <Label>Mesa (opcional)</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.tableId}
                    onChange={e => setForm(f => ({ ...f, tableId: e.target.value }))}
                  >
                    <option value="">Sem mesa</option>
                    {(tablesQ.data?.tables || []).map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.capacity}p)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
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
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista ({resQ.data?.reservations?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(resQ.data?.reservations || []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.reservationTime} • {r.customerName} ({r.partySize}p)
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.code} • {r.status} • {r.tableId ? `Mesa: ${tableNameById.get(r.tableId) || "?"}` : "Sem mesa"} {r.notes ? `• ${r.notes}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                {r.status !== "cancelled" ? (
                  <Button variant="outline" onClick={() => cancel(r.id)}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {resQ.isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
