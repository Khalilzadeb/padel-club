import { NextResponse } from "next/server";
import { getVenueCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...getVenueCookieOptions(0), value: "" });
  return res;
}
