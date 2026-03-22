import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getOpenGame } from "@/lib/data/open-games";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let court = "Open Game";
  let date = "";
  let time = "";
  let endTime = "";
  let spotsLeft = 0;
  let gameType = "ranked";

  if (id) {
    try {
      const game = await getOpenGame(id);
      if (game) {
        const { data: courtRow } = await supabase
          .from("courts")
          .select("name, location")
          .eq("id", game.courtId)
          .single();
        court = courtRow?.location
          ? `${courtRow.location} · ${courtRow.name}`
          : (courtRow?.name ?? court);
        date = game.date;
        time = game.startTime;
        endTime = game.endTime;
        spotsLeft = game.maxPlayers - game.playerIds.length;
        gameType = game.gameType;
      }
    } catch {
      // fallback to defaults
    }
  }

  const isFull = spotsLeft <= 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "40px 60px 0", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#14532d" }}>P</span>
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80", letterSpacing: "0.08em" }}>
            PadelClub
          </span>
          <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", marginLeft: "8px" }}>
            · Open Game
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "36px 60px 0", flex: 1 }}>
          <div style={{ fontSize: "56px", fontWeight: 900, color: "white", lineHeight: "1.1", marginBottom: "16px" }}>
            {court}
          </div>
          {date && (
            <div style={{ fontSize: "30px", color: "#86efac", marginBottom: "40px" }}>
              {date}{time ? `  ·  ${time}${endTime ? ` – ${endTime}` : ""}` : ""}
            </div>
          )}

          {/* Chips */}
          <div style={{ display: "flex", gap: "16px", marginTop: "auto", paddingBottom: "52px" }}>
            <div style={{
              background: isFull ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)",
              border: `2px solid ${isFull ? "rgba(239,68,68,0.5)" : "rgba(74,222,128,0.5)"}`,
              borderRadius: "14px", padding: "14px 28px",
              color: "white", fontSize: "26px", fontWeight: 600,
              display: "flex", alignItems: "center",
            }}>
              {isFull ? "⛔ Full" : `✅ ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
            </div>
            <div style={{
              background: gameType === "ranked" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.1)",
              border: `2px solid ${gameType === "ranked" ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.25)"}`,
              borderRadius: "14px", padding: "14px 28px",
              color: "white", fontSize: "26px", fontWeight: 600,
              display: "flex", alignItems: "center",
            }}>
              {gameType === "ranked" ? "🏆 Ranked" : "🤝 Friendly"}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ height: "8px", background: "linear-gradient(90deg, #4ade80, #16a34a, #4ade80)" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
