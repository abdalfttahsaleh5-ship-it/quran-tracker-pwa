"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * RoutePrefetcher: Warms up primary teacher routes in the client in-memory router cache
 * after initial load so navigation between /dashboard, /students, and /trash is 100% instantaneous (0ms).
 */
export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch key navigation targets in idle time
    const timer = setTimeout(() => {
      router.prefetch("/dashboard");
      router.prefetch("/students");
      router.prefetch("/trash");
    }, 600);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}

