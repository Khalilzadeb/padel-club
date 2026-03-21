"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/players", label: "Players", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-padel-green" />
        <span className="text-sm font-semibold">Admin Panel</span>
        <Link href="/" className="ml-auto text-xs text-gray-400 hover:text-white transition-colors">
          ← Back to site
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden sm:block">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-padel-green text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="sm:hidden flex gap-1 mb-4 w-full">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors",
                  active ? "bg-padel-green text-white" : "bg-white text-gray-600"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
