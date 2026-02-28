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

export default function Cupons() {
  const { token } = useAuthLocal();
  const couponsQ = useQuery({
    queryKey: ["coupons"],
    queryFn: () => apiFetch<{ coupons: any[] }>("/api/coupons", { token }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", active: true });

  async function create() {
    try {
      await apiFetch("/api/coupons", { method: "POST", token, body: { ...form, description: form.description || null } });
      toast.success("Cupom criado");
      setOpen(false);
      setForm({ code: "", description: "", active: true });
      couponsQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggle(c: any) {
    try {
      await apiFetch(`/api/coupons/${c.id}`, { method: "PUT", token, body: { active: !c.active } });
      couponsQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Cupons</div>
          <div className="text-sm text-muted-foreground">Promoções e descontos.</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo cupom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cupom</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Código</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={!form.code.trim()}>
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
          {(couponsQ.data?.coupons || []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
              <div className="min-w-0">
                <div className="font-medium">{c.code}</div>
                {c.description ? <div className="text-xs text-muted-foreground truncate">{c.description}</div> : null}
              </div>
              <Button variant="outline" onClick={() => toggle(c)}>
                {c.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}
          {couponsQ.isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
