import { NextRequest, NextResponse } from "next/server";
import { findVenueAdminByEmail, verifyVenueAdminPassword } from "@/lib/data/venue-admins";
import { signVenueToken, getVenueCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = await findVenueAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyVenueAdminPassword(admin, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signVenueToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      location: admin.location,
    });

    const res = NextResponse.json({
      admin: { id: admin.id, email: admin.email, name: admin.name, location: admin.location },
    });
    res.cookies.set({ ...getVenueCookieOptions(), value: token });
    return res;
  } catch (err) {
    console.error("Venue admin login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
