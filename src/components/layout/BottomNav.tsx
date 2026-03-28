"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Swords, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/contexts/LocaleContext";
import { useState } from "react";

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(10);
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [pressed, setPressed] = useState<string | null>(null);

  const links = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/open-games", label: t.nav.games, icon: Search },
    { href: "/matches", label: t.nav.results, icon: Swords },
    { href: "/players", label: t.nav.players, icon: Users },
    { href: "/messages", label: t.nav.messages, icon: MessageCircle },
  ];

  if (pathname === "/onboarding") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-around px-2 pb-safe">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const isPressed = pressed === href;
          return (
            <Link
              key={href}
              href={href}
              onTouchStart={() => { haptic(); setPressed(href); }}
              onTouchEnd={() => setPressed(null)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[56px]",
                isActive ? "text-padel-green" : "text-gray-400",
                isPressed && "scale-90 opacity-70"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-padel-green" : "text-gray-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
