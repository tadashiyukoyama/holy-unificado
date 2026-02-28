import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-2">Página não encontrada</div>
      <div className="text-sm text-muted-foreground mb-4">A rota não existe.</div>
      <Link href="/">
        <Button>Voltar</Button>
      </Link>
    </div>
  );
}
