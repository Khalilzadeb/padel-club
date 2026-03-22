"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const SKIP_PATHS = ["/onboarding", "/login", "/signup", "/api"];

export default function OnboardingGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user?.playerId) return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;
    if (user.onboardingDone === false) {
      router.replace("/onboarding");
    }
  }, [user, loading, pathname, router]);

  return null;
}
