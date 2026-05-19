"use client";

interface Props {
  aceptado?: boolean;
  setAceptado?: (valor: boolean) => void;
  soloLectura?: boolean;
}

export default function PoliticaCancelacion({ 
  aceptado = false, 
  setAceptado, 
  soloLectura = false 
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <h2 className="font-semibold text-black">Política de Cancelación</h2>
      
      <div className="mt-2 text-sm text-neutral-600 space-y-2">
        <p>
          Las cancelaciones / reprogramaciones deben realizarse con al menos <strong>3 horas</strong> de anticipación respecto a la hora agendada. 
        </p>
        <p>
          Agradecemos tu puntualidad y comprensión.
        </p>
      </div>

      {/* CHECKBOX: Solo se muestra si NO es solo lectura */}
      {!soloLectura && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <label className="flex cursor-pointer items-start gap-3 select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={aceptado}
                // Validamos que setAceptado exista antes de llamarlo
                onChange={(e) => setAceptado && setAceptado(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-neutral-400 bg-white checked:border-black checked:bg-black transition-all"
              />
              <svg
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
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
            <span className="text-sm font-medium text-black">
              He leído y acepto la política de cancelación.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}