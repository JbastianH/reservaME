"use client";

interface Props {
  aceptado?: boolean;
  setAceptado?: (valor: boolean) => void;
  soloLectura?: boolean;
  secondaryColor?: string;
  darkMode?: boolean;
  cancellationHoursBefore?: number;
}

export default function PoliticaCancelacion({
  aceptado = false,
  setAceptado,
  soloLectura = false,
  secondaryColor = "#000000",
  darkMode = false,
  cancellationHoursBefore = 3,
}: Props) {
  return (
    <div
      className={`rounded-xl border p-4 ${darkMode ? "bg-black/30" : "bg-neutral-50"}`}
      style={{
        borderColor: darkMode ? `${secondaryColor}33` : "#e5e5e5",
      }}
    >
      <h2 className={darkMode ? "font-semibold text-white" : "font-semibold text-black"}>
        Política de Cancelación
      </h2>

      <div className={`mt-2 space-y-2 text-sm ${darkMode ? "text-white/65" : "text-neutral-600"}`}>
        <p>
          Las cancelaciones / reprogramaciones deben realizarse con al menos{" "}
          <strong className={darkMode ? "text-white" : "text-black"}>
            {cancellationHoursBefore} horas
          </strong>{" "}
          de anticipación respecto a la hora agendada.
        </p>

        <p>Agradecemos tu puntualidad y comprensión.</p>
      </div>

      {!soloLectura && (
        <div
          className={`mt-4 border-t pt-3 ${darkMode ? "border-white/10" : "border-neutral-200"}`}
        >
          <label className="flex cursor-pointer items-start gap-3 select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={aceptado}
                onChange={(e) => setAceptado && setAceptado(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border bg-white transition-all"
                style={{
                  borderColor: aceptado ? secondaryColor : darkMode ? "#ffffff55" : "#a3a3a3",
                  backgroundColor: "#ffffff",
                }}
              />

              <svg
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  color: secondaryColor,
                }}
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className={`text-sm font-medium ${darkMode ? "text-white/80" : "text-black"}`}>
              He leído y acepto la política de cancelación.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
