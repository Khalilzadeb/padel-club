import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addCommunityAdmin,
  getCommunityAdmins,
  getCommunityBySlug,
  isCommunityAdmin,
  removeCommunityAdmin,
} from "@/lib/data/communities";
import { findUserByEmail, findUserById } from "@/lib/data/users";

const COMMUNITY_SLUG = "padelsmash";

async function guard() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 as const };
  const community = await getCommunityBySlug(COMMUNITY_SLUG);
  if (!community) return { error: "Community not found", status: 404 as const };
  const admin = await isCommunityAdmin(community.id, session.userId);
  if (!admin) return { error: "Forbidden", status: 403 as const };
  return { session, community };
}

// GET — list PadelSmash admins (with name/email). Admin-only.
export async function GET() {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const rows = await getCommunityAdmins(g.community.id);
  const admins = (
    await Promise.all(
      rows.map(async (r) => {
        const u = await findUserById(r.userId);
        if (!u) return null;
        return { userId: u.id, name: u.name, email: u.email, createdAt: r.createdAt };
      })
    )
  ).filter(Boolean);

  return NextResponse.json({ admins, me: g.session.userId });
}

// POST { email } — promote an existing user to PadelSmash admin. Admin-only.
export async function POST(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "user-not-found" }, { status: 404 });

  await addCommunityAdmin(g.community.id, user.id);
  return NextResponse.json({ ok: true, user: { userId: user.id, name: user.name, email: user.email } });
}

// DELETE { userId } — revoke admin. Admin-only; cannot remove yourself.
export async function DELETE(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === g.session.userId) {
    return NextResponse.json({ error: "cannot-remove-self" }, { status: 400 });
  }

  await removeCommunityAdmin(g.community.id, userId);
  return NextResponse.json({ ok: true });
}
