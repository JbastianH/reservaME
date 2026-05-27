import { Suspense } from "react";
import { Metadata } from "next";
import LoginClient from "./LoginClient";


export const metadata: Metadata = {
  title: "Acceso Equipo",
  robots: {
    index: false,
    follow: false,
  },
};

function LoginFallback() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl sm:p-8">
        <div className="h-8 w-44 rounded bg-neutral-800" />
        <div className="mt-3 h-4 w-72 rounded bg-neutral-800" />
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-neutral-800" />
            <div className="h-10 w-full rounded bg-neutral-800" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-neutral-800" />
            <div className="h-10 w-full rounded bg-neutral-800" />
          </div>
          <div className="h-10 w-full rounded bg-neutral-200/30" />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}