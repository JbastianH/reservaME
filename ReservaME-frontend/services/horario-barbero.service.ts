import { apiGet, apiPatch } from "@/lib/api";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type HorarioBarberoItem = {
  id: string;
  barberId: string;
  day: DayOfWeek;
  isClosed: boolean;
  startMin: number;
  endMin: number;
};

export type HorarioBarberoResponse = HorarioBarberoItem[];

export function getHorarioBarbero() {
  return apiGet<HorarioBarberoResponse>("/barbero/horario");
}

export function patchHorarioBarbero(items: Array<{
  day: DayOfWeek;
  isClosed: boolean;
  startMin?: number;
  endMin?: number;
}>) {
  return apiPatch<{ ok: true }>("/barbero/horario", items);
}