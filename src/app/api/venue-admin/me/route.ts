import { NextResponse } from "next/server";
import { getVenueSession } from "@/lib/auth";

export async function GET() {
  const session = await getVenueSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    adminId: session.adminId,
    email: session.email,
    name: session.name,
    location: session.location,
  });
}
