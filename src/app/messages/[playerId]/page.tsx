"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Player } from "@/lib/types";

interface Message {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const otherPlayerId = params.playerId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherPlayer, setOtherPlayer] = useState<Player | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsgId = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${otherPlayerId}`);
    if (!res.ok) return;
    const data: Message[] = await res.json();
    setMessages(data);
    if (data.length > 0) lastMsgId.current = data[data.length - 1].id;
  }, [otherPlayerId]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/players/${otherPlayerId}`).then((r) => r.json()).then((d) => setOtherPlayer(d.player ?? null));
    loadMessages();
  }, [user, otherPlayerId, loadMessages]);

  // Poll every 3 seconds for new messages
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [user, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const optimistic: Message = {
      id: `tmp_${Date.now()}`,
      fromPlayerId: user!.playerId!,
      toPlayerId: otherPlayerId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch(`/api/messages/${otherPlayerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? saved : m));
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <Link href="/messages" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        {otherPlayer && (
          <Link href={`/players/${otherPlayerId}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar name={otherPlayer.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{otherPlayer.name}</p>
              <p className="text-xs text-gray-400 capitalize">{otherPlayer.level}</p>
            </div>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-300 text-sm py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.fromPlayerId === user?.playerId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                isMine ? "bg-padel-green text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-green-100" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-gray-100">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message... (Enter to send)"
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 self-end bg-padel-green text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-green-600 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
