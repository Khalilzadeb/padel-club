import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/data/users";
import { signToken, getSessionCookieOptions } from "@/lib/auth";
import { createPlayer } from "@/lib/data/players";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await createUser(email, name, password);

    // Create player profile and link it
    const playerId = `p${crypto.randomUUID().slice(0, 8)}`;
    await createPlayer(playerId, name, email);
    await supabase.from("users").update({ player_id: playerId }).eq("id", user.id);

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, playerId, needsOnboarding: true } },
      { status: 201 }
    );
    res.cookies.set({ ...getSessionCookieOptions(), value: token });
    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
