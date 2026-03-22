import { ImageResponse } from "next/og";
import { getOpenGame } from "@/lib/data/open-games";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const alt = "Open Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getOpenGame(id);

  if (!game) {
    return new ImageResponse(
      <div style={{ background: "#166534", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "white", fontSize: 56, fontWeight: 800 }}>PadelClub</span>
      </div>
    );
  }

  const { data: court } = await supabase.from("courts").select("name, location").eq("id", game.courtId).single();
  const { data: playerRows } = await supabase.from("players").select("name").in("id", game.playerIds);

  const courtName = court?.location ? `${court.location} · ${court.name}` : (court?.name ?? "Court");
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const playerNames = (playerRows ?? []).map((p: { name: string }) => p.name.split(" ")[0]).join("  ·  ");

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "60px 70px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top label */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <span style={{ color: "#4ade80", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em" }}>PADELCLUB</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 22 }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>Open Game</span>
      </div>

      {/* Court name */}
      <div style={{ color: "white", fontSize: 58, fontWeight: 800, lineHeight: 1.1, marginBottom: 18 }}>
        {courtName}
      </div>

      {/* Date & time */}
      <div style={{ color: "#86efac", fontSize: 32, marginBottom: 48 }}>
        {game.date}  ·  {game.startTime} – {game.endTime}
      </div>

      {/* Bottom chips */}
      <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 28px", color: "white", fontSize: 26, display: "flex", alignItems: "center", gap: 10 }}>
          <span>👥</span>
          <span>{game.playerIds.length}/{game.maxPlayers}</span>
        </div>
        <div style={{
          background: spotsLeft > 0 ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)",
          border: `2px solid ${spotsLeft > 0 ? "rgba(74,222,128,0.6)" : "rgba(239,68,68,0.6)"}`,
          borderRadius: 14, padding: "14px 28px", color: "white", fontSize: 26,
        }}>
          {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Full"}
        </div>
        <div style={{
          background: game.gameType === "ranked" ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.1)",
          border: `2px solid ${game.gameType === "ranked" ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.2)"}`,
          borderRadius: 14, padding: "14px 28px", color: "white", fontSize: 26,
        }}>
          {game.gameType === "ranked" ? "🏆 Ranked" : "🤝 Friendly"}
        </div>
        {game.isPrivate && (
          <div style={{ background: "rgba(168,85,247,0.25)", border: "2px solid rgba(168,85,247,0.5)", borderRadius: 14, padding: "14px 28px", color: "white", fontSize: 26 }}>
            🔒 Private
          </div>
        )}
      </div>

      {/* Player names */}
      {playerNames && (
        <div style={{ color: "rgba(134,239,172,0.85)", fontSize: 20, marginTop: 20 }}>
          {playerNames}
        </div>
      )}
    </div>
  );
}
