"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Calendar, Users, Trophy, Swords, LogOut, User, ChevronDown, Search, MessageCircle, Shield, Target, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "@/components/layout/NotificationBell";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/open-games", label: "Games", icon: Search },
  { href: "/players", label: "Players", icon: Users },
  { href: "/matches", label: "Results", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/challenges", label: "Challenges", icon: Target },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-padel-green rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg hidden sm:block">PadelClub</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-green-50 dark:bg-green-900/30 text-padel-green"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <NotificationBell />
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
                      <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      {user.playerId && (
                        <Link
                          href={`/players/${user.playerId}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          My Profile
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-padel-green hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile — theme toggle + notification + user */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <NotificationBell />
            {!loading && user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
              </button>
            )}
            {!loading && !user && (
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pb-4 pt-2 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium",
                pathname === href
                  ? "bg-green-50 dark:bg-green-900/30 text-padel-green"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                {user.playerId && (
                  <Link href={`/players/${user.playerId}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-padel-green hover:bg-green-50 dark:hover:bg-green-900/30">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 mt-1">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button className="w-full" size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
