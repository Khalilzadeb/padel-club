"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// When the app comes back to foreground (e.g. switching apps on mobile),
// refresh the current page so data is always up to date.
export default function AppRefresh() {
  const router = useRouter();

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [router]);

  return null;
}
