"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Bell, MessageCircle, Users, Trophy, CheckCheck, Gamepad2, Swords } from "lucide-react";
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
  if (type === "tournament_register") return <Trophy className="w-4 h-4 text-amber-500" />;
  if (type === "game_full" || type === "game_cancelled" || type === "open_game" || type === "game_invite") return <Gamepad2 className="w-4 h-4 text-purple-500" />;
  if (type === "challenge" || type === "challenge_accepted" || type === "challenge_declined") return <Swords className="w-4 h-4 text-orange-500" />;
  return <Users className="w-4 h-4 text-padel-green" />;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium disabled:text-gray-300 text-padel-green hover:text-green-700 disabled:cursor-default"
        >
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              filter === f ? "bg-padel-green text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
          {displayed.map((n) => {
            const content = (
              <div className={cn("flex gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50", !n.read && "bg-blue-50/40 dark:bg-blue-900/10")}>
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm text-gray-900 dark:text-white", !n.read && "font-semibold")}>{n.title}</p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
