import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword } from "@/lib/data/users";
import { signToken, getSessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(user, password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, email: user.email, name: user.name });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, playerId: user.playerId },
  });
  res.cookies.set({ ...getSessionCookieOptions(), value: token });
  return res;
}
