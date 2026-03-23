import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createElement as h } from "react";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const court = searchParams.get("court") ?? "Open Game";
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const end = searchParams.get("end") ?? "";
  const spots = parseInt(searchParams.get("spots") ?? "1", 10);
  const type = searchParams.get("type") ?? "ranked";
  const elo = searchParams.get("elo") ?? "";
  const isFull = spots <= 0;
  const formattedDate = date ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "";

  const spotColor = isFull ? "rgba(239,68,68,0.25)" : "rgba(74,222,128,0.25)";
  const spotBorder = isFull ? "rgba(239,68,68,0.6)" : "rgba(74,222,128,0.6)";
  const typeColor = type === "ranked" ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.12)";
  const typeBorder = type === "ranked" ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.3)";

  const image = h("div", {
    style: {
      width: "1200px", height: "630px", display: "flex", flexDirection: "column",
      background: "linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)",
      fontFamily: "sans-serif",
    },
  },
    // Header
    h("div", { style: { display: "flex", alignItems: "center", padding: "44px 64px 0", gap: "18px" } },
      h("div", {
        style: {
          width: "60px", height: "60px", borderRadius: "50%", background: "#4ade80",
          display: "flex", alignItems: "center", justifyContent: "center",
        },
      }, h("span", { style: { fontSize: "30px", fontWeight: 900, color: "#14532d" } }, "P")),
      h("span", { style: { fontSize: "30px", fontWeight: 800, color: "#4ade80", letterSpacing: "2px" } }, "PADELCLUB"),
      h("span", { style: { fontSize: "20px", color: "rgba(255,255,255,0.4)", marginLeft: "8px" } }, "Open Game"),
    ),
    // Court name
    h("div", { style: { fontSize: "60px", fontWeight: 900, color: "white", padding: "32px 64px 0", lineHeight: "1.1" } }, court),
    // Date
    formattedDate && h("div", { style: { fontSize: "30px", color: "#86efac", padding: "14px 64px 0" } },
      `${formattedDate}${time ? "  /  " + time + (end ? " - " + end : "") : ""}`
    ),
    // Chips
    h("div", { style: { display: "flex", gap: "16px", padding: "36px 64px 0", marginTop: "auto" } },
      h("div", {
        style: {
          background: spotColor, border: `2px solid ${spotBorder}`,
          borderRadius: "12px", padding: "12px 28px",
          color: "white", fontSize: "26px", fontWeight: 700, display: "flex", alignItems: "center",
        },
      }, isFull ? "FULL" : `${spots} spot${spots !== 1 ? "s" : ""} left`),
      h("div", {
        style: {
          background: typeColor, border: `2px solid ${typeBorder}`,
          borderRadius: "12px", padding: "12px 28px",
          color: "white", fontSize: "26px", fontWeight: 700, display: "flex", alignItems: "center",
        },
      }, type === "ranked" ? "RANKED" : "FRIENDLY"),
      elo ? h("div", {
        style: {
          background: "rgba(251,191,36,0.2)", border: "2px solid rgba(251,191,36,0.6)",
          borderRadius: "12px", padding: "12px 28px",
          color: "white", fontSize: "26px", fontWeight: 700, display: "flex", alignItems: "center",
        },
      }, `ELO ${elo}`) : null,
    ),
    // Bottom bar
    h("div", { style: { height: "10px", marginTop: "auto", background: "linear-gradient(90deg, #4ade80, #16a34a, #4ade80)" } }),
  );

  return new ImageResponse(image, { width: 1200, height: 630 });
}
