import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReservations, useTables, useWaitlist, useCustomers } from "@/hooks/useApi";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Dashboard() {
  const date = todayISO();
  const tables = useTables();
  const reservations = useReservations(date);
  const waitlist = useWaitlist();
  const customers = useCustomers();

  const cards = [
    { title: "Mesas ativas", value: tables.data?.tables?.length ?? 0 },
    { title: "Reservas hoje", value: reservations.data?.reservations?.length ?? 0 },
    { title: "Fila", value: waitlist.data?.waitlist?.filter((w: any) => w.status !== "cancelled" && w.status !== "seated").length ?? 0 },
    { title: "Clientes", value: customers.data?.customers?.length ?? 0 },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-semibold">Dashboard</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{c.value}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atalhos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use <span className="font-medium">Mesas</span> para arrastar mesas no mapa e soltar clientes da fila/reservas em uma mesa.
        </CardContent>
      </Card>
    </div>
  );
}
