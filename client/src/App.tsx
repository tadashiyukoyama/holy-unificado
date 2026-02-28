import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuthLocal } from "@/contexts/AuthLocalContext";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Mesas from "@/pages/Mesas";
import Reservas from "@/pages/Reservas";
import Fila from "@/pages/Fila";
import Clientes from "@/pages/Clientes";
import Eventos from "@/pages/Eventos";
import Cupons from "@/pages/Cupons";
import WhatsApp from "@/pages/WhatsApp";
import Configuracoes from "@/pages/Configuracoes";
import Suporte from "@/pages/Suporte";
import NotFound from "@/pages/NotFound";

function Private({ children }: { children: any }) {
  const { autenticado, carregando } = useAuthLocal();
  if (carregando) return null;
  if (!autenticado) return <Redirect to="/login" />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster richColors />
        <Switch>
          <Route path="/login" component={Login} />

          <Route>
            <Private>
              <DashboardLayout>
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/mesas" component={Mesas} />
                  <Route path="/reservas" component={Reservas} />
                  <Route path="/fila" component={Fila} />
                  <Route path="/clientes" component={Clientes} />
                  <Route path="/eventos" component={Eventos} />
                  <Route path="/cupons" component={Cupons} />
                  <Route path="/whatsapp" component={WhatsApp} />
                  <Route path="/configuracoes" component={Configuracoes} />
                  <Route path="/suporte" component={Suporte} />
                  <Route component={NotFound} />
                </Switch>
              </DashboardLayout>
            </Private>
          </Route>
        </Switch>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
