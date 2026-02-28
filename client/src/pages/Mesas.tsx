import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthLocal } from "@/contexts/AuthLocalContext";
import { apiFetch } from "@/lib/api";
import { useOccupancy, useReservations, useRooms, useTables, useWaitlist } from "@/hooks/useApi";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Table = any;

export default function Mesas() {
  const { token } = useAuthLocal();
  const roomsQ = useRooms();
  const [roomId, setRoomId] = useState<string | null>(null);
  const tablesQ = useTables(roomId);
  const [localTables, setLocalTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedTime, setSelectedTime] = useState("20:00");

  const occQ = useOccupancy(selectedDate, selectedTime, roomId);
  const resQ = useReservations(selectedDate);
  const waitQ = useWaitlist();

  useEffect(() => {
    if (roomsQ.data?.rooms?.length && !roomId) {
      setRoomId(roomsQ.data.rooms[0].id);
    }
  }, [roomsQ.data, roomId]);

  useEffect(() => {
    setLocalTables(tablesQ.data?.tables || []);
  }, [tablesQ.data]);

  const selectedTable = useMemo(
    () => localTables.find(t => t.id === selectedTableId) || null,
    [localTables, selectedTableId]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const occMap = useMemo(() => {
    const m = new Map<string, any>();
    (occQ.data?.tables || []).forEach((o: any) => m.set(o.id, o));
    return m;
  }, [occQ.data]);

  async function createDefaultRoom() {
    try {
      const res = await apiFetch<{ room: any }>("/api/tables/rooms", {
        method: "POST",
        token,
        body: { name: "Salão principal", width: 900, height: 560 },
      });
      toast.success("Salão criado");
      roomsQ.refetch();
      setRoomId(res.room.id);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function addTable() {
    const code = prompt("Código da mesa (ex: M01)")?.trim();
    if (!code) return;
    const name = prompt("Nome (ex: Mesa 01)")?.trim() || code;
    const cap = Number(prompt("Capacidade (pessoas)", "2") || "2");
    try {
      await apiFetch("/api/tables", {
        method: "POST",
        token,
        body: { roomId, code, name, capacity: cap, shape: "round", status: "available" },
      });
      toast.success("Mesa criada");
      tablesQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function saveTable(t: Table) {
    try {
      await apiFetch(`/api/tables/${t.id}`, { method: "PUT", token, body: t });
      toast.success("Mesa atualizada");
      tablesQ.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function onTableMouseDown(e: React.MouseEvent, t: Table) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTableId(t.id);

    dragRef.current = {
      id: t.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: Number(t.x || 0),
      origY: Number(t.y || 0),
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setLocalTables(prev =>
        prev.map(x =>
          x.id === dragRef.current!.id
            ? { ...x, x: Math.max(0, Math.round(dragRef.current!.origX + dx)), y: Math.max(0, Math.round(dragRef.current!.origY + dy)) }
            : x
        )
      );
    };

    const onUp = async () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;

      const moved = localTables.find(x => x.id === d.id);
      if (!moved) return;

      try {
        await apiFetch(`/api/tables/${d.id}/move`, {
          method: "POST",
          token,
          body: { x: moved.x, y: moved.y, w: moved.w, h: moved.h, rotation: moved.rotation || 0 },
        });
      } catch (e: any) {
        toast.error(e.message);
        tablesQ.refetch();
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function onDropAssign(e: React.DragEvent, table: Table) {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    let payload: any = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    if (!payload?.source_type || !payload?.source_id) return;

    try {
      await apiFetch("/api/assign/table", {
        method: "POST",
        token,
        body: {
          ...payload,
          table_id: table.id,
          reservation_date: selectedDate,
          reservation_time: selectedTime,
        },
      });
      toast.success(`Alocado na ${table.name}`);
      await Promise.allSettled([resQ.refetch(), waitQ.refetch(), occQ.refetch()]);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (roomsQ.isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!roomsQ.data?.rooms?.length) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Primeiro acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Nenhum salão cadastrado.</div>
            <Button onClick={createDefaultRoom}>Criar salão padrão</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const room = roomsQ.data.rooms.find((r: any) => r.id === roomId) || roomsQ.data.rooms[0];
  const canvasW = room?.width || 900;
  const canvasH = room?.height || 560;

  const assignables = [
    ...(waitQ.data?.waitlist || [])
      .filter((w: any) => ["waiting", "contacted"].includes(w.status))
      .map((w: any) => ({ type: "waitlist", id: w.id, title: `${w.customerName} (${w.partySize}p)`, sub: w.customerPhone || "" })),
    ...(resQ.data?.reservations || [])
      .filter((r: any) => ["pending", "confirmed"].includes(r.status))
      .map((r: any) => ({ type: "reservation", id: r.id, title: `${r.customerName} (${r.partySize}p)`, sub: `${r.reservationTime} ${r.tableId ? "• já tem mesa" : ""}` })),
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xl font-semibold">Mesas e Salão</div>
          <div className="text-sm text-muted-foreground">Arraste mesas no mapa. Arraste cliente/reserva e solte na mesa.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => Promise.allSettled([tablesQ.refetch(), occQ.refetch(), resQ.refetch(), waitQ.refetch()])}>
            Recarregar
          </Button>
          <Button onClick={addTable}>Adicionar mesa</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mapa do salão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-56">
                <Label>Salão</Label>
                <Select value={roomId || ""} onValueChange={v => setRoomId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomsQ.data.rooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => occQ.refetch()}>
                Status automático
              </Button>
              <Button variant="outline" onClick={() => setSelectedTableId(null)}>
                Limpar seleção
              </Button>
            </div>

            <div
              ref={containerRef}
              className="relative rounded-md border bg-muted/20 overflow-hidden"
              style={{ width: "100%", height: canvasH, maxWidth: "100%" }}
              onClick={() => setSelectedTableId(null)}
            >
              <div style={{ width: canvasW, height: canvasH, position: "relative" }}>
                {localTables
                  .filter(t => t.isActive)
                  .map(t => {
                    const occ = occMap.get(t.id);
                    const effective = occ?.effective_status || t.status;
                    const cls =
                      effective === "occupied"
                        ? "bg-red-500/20 border-red-500"
                        : effective === "blocked" || effective === "out_of_service"
                          ? "bg-yellow-500/20 border-yellow-500"
                          : "bg-emerald-500/10 border-emerald-500/40";

                    return (
                      <div
                        key={t.id}
                        className={`absolute select-none cursor-move rounded-xl border p-2 text-xs whitespace-pre-line ${cls} ${selectedTableId === t.id ? "ring-2 ring-primary" : ""}`}
                        style={{
                          left: t.x,
                          top: t.y,
                          width: t.w,
                          height: t.h,
                          transform: `rotate(${t.rotation || 0}deg)`,
                        }}
                        onMouseDown={e => onTableMouseDown(e, t)}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedTableId(t.id);
                        }}
                        onDragOver={e => {
                          if (e.dataTransfer.types.includes("application/json")) e.preventDefault();
                        }}
                        onDrop={e => onDropAssign(e, t)}
                        title={occ?.active_reservation ? `Reserva: ${occ.active_reservation.code} • ${occ.active_reservation.customer_name}` : ""}
                      >
                        {t.name}
                        {"\n"}
                        {t.capacity}p
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mesa selecionada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!selectedTable ? (
                <div className="text-sm text-muted-foreground">Clique em uma mesa para editar.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Código</Label>
                      <Input value={selectedTable.code} onChange={e => setLocalTables(prev => prev.map(x => (x.id === selectedTable.id ? { ...x, code: e.target.value } : x)))} />
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input value={selectedTable.name} onChange={e => setLocalTables(prev => prev.map(x => (x.id === selectedTable.id ? { ...x, name: e.target.value } : x)))} />
                    </div>
                    <div>
                      <Label>Capacidade</Label>
                      <Input
                        type="number"
                        value={selectedTable.capacity}
                        onChange={e => setLocalTables(prev => prev.map(x => (x.id === selectedTable.id ? { ...x, capacity: Number(e.target.value) } : x)))}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={selectedTable.status}
                        onValueChange={v => setLocalTables(prev => prev.map(x => (x.id === selectedTable.id ? { ...x, status: v } : x)))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="blocked">Bloqueada</SelectItem>
                          <SelectItem value="out_of_service">Fora de serviço</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => saveTable(selectedTable)}>
                    Salvar mesa
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Arrastar e soltar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Arraste um item e solte em cima de uma mesa no mapa (usa a data/hora selecionadas).
              </div>
              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {assignables.map(a => (
                  <div
                    key={`${a.type}:${a.id}`}
                    className="rounded-md border p-2 text-sm bg-background hover:bg-muted/40 cursor-grab"
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("application/json", JSON.stringify({ source_type: a.type, source_id: a.id }));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <div className="font-medium">{a.title}</div>
                    {a.sub ? <div className="text-xs text-muted-foreground">{a.sub}</div> : null}
                  </div>
                ))}
                {!assignables.length ? <div className="text-sm text-muted-foreground">Sem itens para alocar.</div> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
