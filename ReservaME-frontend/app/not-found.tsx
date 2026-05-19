import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-neutral-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-black sm:text-3xl">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-neutral-600 sm:text-base">
          La página que estás buscando no existe o fue movida.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}