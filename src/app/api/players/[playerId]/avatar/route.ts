import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/data/users";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;

  const token = req.cookies.get("padel_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await findUserById(payload.userId);
  if (user?.playerId !== playerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${playerId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase.from("players").update({ avatar_url: publicUrl }).eq("id", playerId);

  return NextResponse.json({ avatarUrl: publicUrl });
}
