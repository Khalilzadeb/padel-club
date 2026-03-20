"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { MessageCircle } from "lucide-react";
import { Player } from "@/lib/types";

interface Conversation {
  otherPlayerId: string;
  lastMessage: { content: string; createdAt: string; fromPlayerId: string };
  unreadCount: number;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/messages").then((r) => r.json()),
      fetch("/api/players").then((r) => r.json()),
    ]).then(([convsData, playersData]) => {
      setConvs(convsData);
      setPlayers(playersData.map((d: { player: Player }) => d.player));
      setLoading(false);
    });
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Messages</h1>

      {convs.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No conversations yet</p>
          <p className="text-gray-300 text-sm mt-1">Go to a player&apos;s profile and send them a message</p>
        </div>
      ) : (
        <Card className="divide-y divide-gray-50">
          {convs.map((conv) => {
            const other = players.find((p) => p.id === conv.otherPlayerId);
            if (!other) return null;
            const isMe = conv.lastMessage.fromPlayerId === user?.playerId;
            return (
              <Link key={conv.otherPlayerId} href={`/messages/${conv.otherPlayerId}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div className="relative flex-shrink-0">
                  <Avatar name={other.name} imageUrl={other.avatarUrl} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-padel-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-gray-900 ${conv.unreadCount > 0 ? "" : "font-medium"}`}>
                    {other.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {isMe ? "You: " : ""}{conv.lastMessage.content}
                  </p>
                </div>
                <p className="text-xs text-gray-300 flex-shrink-0">
                  {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
