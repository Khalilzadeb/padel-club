"use client";
import { useState } from "react";
import { Swords } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Player, Court } from "@/lib/types";

interface Props {
  player: Player;
  courts: Court[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

function groupCourtsByLocation(courts: Court[]): Record<string, Court[]> {
  const groups: Record<string, Court[]> = {};
  for (const c of courts) {
    const key = c.location?.trim() || "Other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export default function ChallengeButton({ player, courts }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const activeCourts = courts.filter((c) => c.isActive);
  const [courtId, setCourtId] = useState(activeCourts[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState("10");
  const [matchType, setMatchType] = useState<"casual" | "ranked">("casual");
  const [message, setMessage] = useState("");

  if (!user?.playerId || user.playerId === player.id) return null;

  const proposedTime = `${hour.padStart(2, "0")}:00`;

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengedId: player.id, courtId, proposedDate: date, proposedTime, matchType, message }),
      });
      if (res.ok) { setSent(true); setTimeout(() => { setOpen(false); setSent(false); }, 1500); }
      else { const err = await res.json(); alert(err.error ?? "Failed to send challenge"); }
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400";
  const selectClass = inputClass;
  const courtGroups = groupCourtsByLocation(activeCourts);
  const hasGroups = Object.keys(courtGroups).length > 1 || (Object.keys(courtGroups).length === 1 && Object.keys(courtGroups)[0] !== "Other");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-padel-green hover:bg-green-600 text-sm text-white font-medium transition-colors"
      >
        <Swords className="w-3.5 h-3.5" /> Challenge
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Challenge ${player.name}`} size="sm">
        {sent ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">⚔️</p>
            <p className="font-semibold text-gray-900 dark:text-white">Challenge sent!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{player.name} will be notified</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Match type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Match type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["casual", "ranked"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setMatchType(t)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${matchType === t ? "border-padel-green bg-green-50 dark:bg-green-900/30 text-padel-green" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Court */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Court</label>
              <select value={courtId} onChange={(e) => setCourtId(e.target.value)} className={selectClass}>
                {hasGroups
                  ? Object.entries(courtGroups).map(([location, lCourts]) => (
                      <optgroup key={location} label={location}>
                        {lCourts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))
                  : activeCourts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                }
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date</label>
              <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>

            {/* Time — 24h hour select */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Time</label>
              <select value={hour} onChange={(e) => setHour(e.target.value)} className={selectClass}>
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Say something to ${player.name}...`}
                rows={2}
                className={inputClass + " resize-none"}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSend} disabled={sending || !courtId || !date} className="flex-1">
                {sending ? "Sending..." : "Send Challenge"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
