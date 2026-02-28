import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useSettings } from "@/hooks/useApi";

export default function Configuracoes() {
  const { token } = useAuthLocal();
  const q = useSettings();
  const [tempo, setTempo] = useState("60");

  useEffect(() => {
    if (q.data?.settings?.tempo_medio_mesa) setTempo(q.data.settings.tempo_medio_mesa);
  }, [q.data]);

  async function salvar() {
    try {
      await apiFetch("/api/settings", { method: "POST", token, body: { tempo_medio_mesa: tempo } });
      toast.success("Salvo");
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-semibold">Configurações</div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="max-w-xs">
            <Label>Tempo médio por mesa (min)</Label>
            <Input type="number" value={tempo} onChange={e => setTempo(e.target.value)} />
          </div>
          <Button onClick={salvar}>Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
