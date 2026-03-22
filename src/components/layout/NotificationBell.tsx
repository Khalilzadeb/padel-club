"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle, Users, X, CheckCheck, Gamepad2, Swords } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils/cn";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const typeIcon = (type: string) => {
  if (type === "message") return <MessageCircle className="w-4 h-4 text-blue-500" />;
  if (type === "open_game") return <Gamepad2 className="w-4 h-4 text-purple-500" />;
  if (type === "challenge" || type === "challenge_accepted" || type === "challenge_declined") return <Swords className="w-4 h-4 text-orange-500" />;
  return <Users className="w-4 h-4 text-padel-green" />;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const load = () => {
    if (!user?.playerId) return;
    fetch("/api/notifications").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setNotifications(data);
    });
  };

  useEffect(() => {
    if (!user?.playerId) return;
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.playerId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      fetch("/api/notifications", { method: "PATCH" }).then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  };

  if (!user?.playerId) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.map((n) => (
                n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className={cn("flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors", !n.read && "bg-blue-50/50")}
                  >
                    <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  </Link>
                ) : (
                  <div key={n.id} className={cn("flex gap-3 px-4 py-3", !n.read && "bg-blue-50/50")}>
                    <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.body}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-300 flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Marked as read when opened
            </p>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-padel-green hover:underline font-medium">
              See all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
