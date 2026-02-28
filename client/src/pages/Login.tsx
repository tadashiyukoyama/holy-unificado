import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuthLocal();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Holy Water • Painel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm">Email</div>
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Senha</div>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const r = await login(email, password);
              setLoading(false);
              if (!r.sucesso) return toast.error(r.erro || "Falha no login");
              toast.success("Logado");
              setLocation("/");
            }}
          >
            Entrar
          </Button>
          <div className="text-xs text-muted-foreground">
            Admin inicial padrão: <span className="font-mono">admin@local / admin123</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
