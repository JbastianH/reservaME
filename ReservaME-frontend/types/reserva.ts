export type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

export type Reserva = {
  id: string;
  barberId: string;
  serviceId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  priceFinal: string;
  durationFinalMin: number;
  status: EstadoReserva;
};