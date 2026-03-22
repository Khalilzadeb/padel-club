"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Swords, Trophy, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/open-games", label: "Games", icon: Search },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/players", label: "Players", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-around px-2 pb-safe">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors min-w-[56px]",
                isActive ? "text-padel-green" : "text-gray-400"
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
