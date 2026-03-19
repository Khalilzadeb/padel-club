import { NextResponse } from "next/server";
import { getCourts } from "@/lib/data/courts";

export async function GET() {
  const courts = await getCourts();
  return NextResponse.json(courts);
}
