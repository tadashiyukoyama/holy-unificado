import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthLocal } from "@/contexts/AuthLocalContext";

export function useRooms() {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<{ rooms: any[] }>("/api/tables/rooms", { token }),
  });
}

export function useTables(roomId?: string | null) {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["tables", roomId || "all"],
    queryFn: () =>
      apiFetch<{ tables: any[] }>(`/api/tables${roomId ? `?roomId=${roomId}` : ""}`, { token }),
  });
}

export function useReservations(date?: string) {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["reservations", date || "all"],
    queryFn: () => apiFetch<{ reservations: any[] }>(`/api/reservations${date ? `?date=${date}` : ""}`, { token }),
  });
}

export function useWaitlist() {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["waitlist"],
    queryFn: () => apiFetch<{ waitlist: any[] }>("/api/waitlist", { token }),
  });
}

export function useCustomers(q?: string) {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["customers", q || ""],
    queryFn: () => apiFetch<{ customers: any[] }>(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token }),
  });
}

export function useSettings() {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: Record<string, string> }>("/api/settings", { token }),
  });
}

export function useOccupancy(date: string, time: string, roomId?: string | null) {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["occupancy", date, time, roomId || ""],
    queryFn: () =>
      apiFetch<{ tables: any[] }>(`/api/occupancy?date=${date}&time=${time}${roomId ? `&roomId=${roomId}` : ""}`, { token }),
    enabled: !!date && !!time,
    staleTime: 5000,
  });
}

export function useSupportTools() {
  const { token } = useAuthLocal();
  return useQuery({
    queryKey: ["support_tools"],
    queryFn: () => apiFetch<{ tools: any[] }>("/api/support/tools", { token }),
  });
}

export function useSupportScan() {
  const { token } = useAuthLocal();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<any>("/api/support/scan", { method: "POST", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support_tools"] });
    },
  });
}

export function useAssignToTable() {
  const { token } = useAuthLocal();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiFetch<any>("/api/assign/table", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
