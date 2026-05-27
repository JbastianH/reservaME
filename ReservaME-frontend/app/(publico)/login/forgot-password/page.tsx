import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

function ForgotPasswordFallback() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl border border-neutral-800 sm:p-8">
        <div className="h-8 w-48 rounded bg-neutral-800 animate-pulse" />
        <div className="mt-3 h-4 w-64 rounded bg-neutral-800 animate-pulse" />
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-neutral-800 animate-pulse" />
            <div className="h-10 w-full rounded bg-neutral-800 animate-pulse" />
          </div>
          <div className="h-10 w-full rounded bg-neutral-200/30 animate-pulse" />
          <div className="h-4 w-32 mx-auto rounded bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}