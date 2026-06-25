export const POLITICA_CANCELACION_TITULO = "POLÍTICA DE CANCELACIÓN";

export const POLITICA_CANCELACION_HORAS_DEFAULT = 3;

export function construirPoliticaCancelacionTexto(horas: number) {
  return `RECORDAR CANCELAR O REPROGRAMAR HASTA ${horas} HORAS ANTES DE LA CITA.`;
}