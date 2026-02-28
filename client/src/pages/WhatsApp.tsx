import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function WhatsApp() {
  const { token } = useAuthLocal();
  const statusQ = useQuery({
    queryKey: ["whatsapp_status"],
    queryFn: () => apiFetch<any>("/api/whatsapp/status", { token }),
  });

  async function sendTest() {
    try {
      await apiFetch("/api/whatsapp/send-test", { method: "POST", token, body: {} });
      toast.success("Enviado");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-semibold">WhatsApp</div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">enabled:</span> {String(statusQ.data?.enabled ?? false)}</div>
          <div><span className="text-muted-foreground">mode:</span> {statusQ.data?.mode || "-"}</div>
          <div className="text-muted-foreground">{statusQ.data?.message || ""}</div>
          <div className="pt-2">
            <Button variant="outline" onClick={() => statusQ.refetch()}>Recarregar</Button>
            <Button className="ml-2" onClick={sendTest}>Enviar teste</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nota</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Integração WhatsApp Cloud API (Meta) fica atrás de <span className="font-mono">WHATSAPP_ENABLED</span>. Enquanto estiver em review, os endpoints respondem com “not implemented”.
        </CardContent>
      </Card>
    </div>
  );
}
