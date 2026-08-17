"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Eagerly prefetch core routes in the background after initial render
    const routesToPrefetch = [
      "/dashboard",
      "/students",
      "/login",
      "/parent",
    ];

    // Use requestIdleCallback or setTimeout to avoid blocking initial paint
    const prefetchRoutes = () => {
      routesToPrefetch.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {
          // Silently ignore prefetch failures (e.g. offline or unauthenticated)
        }
      });
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const timer = setTimeout(prefetchRoutes, 500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  return null;
}
