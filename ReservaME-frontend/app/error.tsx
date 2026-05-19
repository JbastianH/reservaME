"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-neutral-500">Error</p>
        <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">
          Algo salió mal
        </h1>
        <p className="mt-3 text-sm text-neutral-600 sm:text-base">
          Ocurrió un problema inesperado. Puedes intentar nuevamente.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Reintentar
          </button>

          <Link
            href="/"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}