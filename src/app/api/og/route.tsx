import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const court = searchParams.get("court") ?? "Open Game";
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const endTime = searchParams.get("end") ?? "";
  const spots = parseInt(searchParams.get("spots") ?? "1", 10);
  const type = searchParams.get("type") ?? "ranked";
  const isFull = spots <= 0;

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

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", padding: "36px 60px 0", flex: 1 }}>
          <div style={{ fontSize: "56px", fontWeight: 900, color: "white", lineHeight: "1.1", marginBottom: "16px" }}>
            {court}
          </div>
          {date && (
            <div style={{ fontSize: "30px", color: "#86efac", marginBottom: "40px" }}>
              {date}{time ? `  ·  ${time}${endTime ? ` – ${endTime}` : ""}` : ""}
            </div>
          )}

          <div style={{ display: "flex", gap: "16px", marginTop: "auto", paddingBottom: "52px" }}>
            <div style={{
              background: isFull ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)",
              border: `2px solid ${isFull ? "rgba(239,68,68,0.5)" : "rgba(74,222,128,0.5)"}`,
              borderRadius: "14px", padding: "14px 28px",
              color: "white", fontSize: "26px", fontWeight: 600, display: "flex", alignItems: "center",
            }}>
              {isFull ? "⛔ Full" : `✅ ${spots} spot${spots !== 1 ? "s" : ""} left`}
            </div>
            <div style={{
              background: type === "ranked" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.1)",
              border: `2px solid ${type === "ranked" ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.25)"}`,
              borderRadius: "14px", padding: "14px 28px",
              color: "white", fontSize: "26px", fontWeight: 600, display: "flex", alignItems: "center",
            }}>
              {type === "ranked" ? "🏆 Ranked" : "🤝 Friendly"}
            </div>
          </div>
        </div>

        <div style={{ height: "8px", background: "linear-gradient(90deg, #4ade80, #16a34a, #4ade80)" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
