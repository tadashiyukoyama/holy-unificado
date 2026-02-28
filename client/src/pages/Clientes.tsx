import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useCustomers } from "@/hooks/useApi";

export default function Clientes() {
  const { token } = useAuthLocal();
  const [q, setQ] = useState("");
  const customersQ = useCustomers(q);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  async function create() {
    try {
      await apiFetch("/api/customers", { method: "POST", token, body: { ...form, phone: form.phone || null, notes: form.notes || null } });
      toast.success("Cliente criado");
      setOpen(false);
      setForm({ name: "", phone: "", notes: "" });
      customersQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Clientes</div>
          <div className="text-sm text-muted-foreground">Busca por nome/telefone/nota.</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!form.name.trim()}>
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
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Buscar</Label>
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="nome, telefone, observação" />
            </div>
            <Button variant="outline" onClick={() => customersQ.refetch()}>
              Filtrar
            </Button>
          </div>

          {(customersQ.data?.customers || []).map((c: any) => (
            <div key={c.id} className="rounded-md border p-2">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.phone || ""} {c.notes ? `• ${c.notes}` : ""}
              </div>
            </div>
          ))}
          {customersQ.isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
