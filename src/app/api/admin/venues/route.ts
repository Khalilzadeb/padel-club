import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET — list all venue admins
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("venue_admins")
    .select("id, email, name, location, created_at")
    .order("location");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create venue admin
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, location, password } = await req.json();
  if (!email || !name || !location || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("venue_admins")
    .insert({ id: `va_${Date.now()}`, email, name, location, password_hash: passwordHash })
    .select("id, email, name, location, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove venue admin
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("venue_admins").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

// PATCH — reset password
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, password } = await req.json();
  if (!id || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await supabase.from("venue_admins").update({ password_hash: passwordHash }).eq("id", id);
  return NextResponse.json({ ok: true });
}
