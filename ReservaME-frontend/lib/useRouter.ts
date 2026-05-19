import { useRouter as useNextRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingProvider";
import { useCallback, useRef } from "react";

type RouterMethod = "push" | "replace" | "back" | "forward" | "refresh" | "prefetch";

const LOADING_DELAY = 300; // Mostrar skeleton después de 300ms

export function useRouter() {
  const router = useNextRouter();
  const { startLoading, stopLoading } = useLoading();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wrapper para push con loading
  const push = useCallback(
    (href: string) => {
      // Inicia un timer para mostrar el loading después de LOADING_DELAY
      timeoutRef.current = setTimeout(() => {
        startLoading();
      }, LOADING_DELAY);

      try {
        router.push(href);
      } catch (e) {
        // Si hay error, limpia el timer y detiene loading
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        stopLoading();
        throw e;
      }
    },
    [router, startLoading, stopLoading]
  );

  // Wrapper para replace con loading
  const replace = useCallback(
    (href: string) => {
      // Inicia un timer para mostrar el loading después de LOADING_DELAY
      timeoutRef.current = setTimeout(() => {
        startLoading();
      }, LOADING_DELAY);

      try {
        router.replace(href);
      } catch (e) {
        // Si hay error, limpia el timer y detiene loading
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        stopLoading();
        throw e;
      }
    },
    [router, startLoading, stopLoading]
  );

  return {
    push,
    replace,
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  };
}
