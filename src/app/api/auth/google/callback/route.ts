import { NextRequest, NextResponse } from "next/server";
import {
  findUserByGoogleId,
  findUserByEmail,
  createGoogleUser,
  linkGoogleId,
} from "@/lib/data/users";
import { signToken, getSessionCookieOptions } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=google_denied", req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=invalid_callback", req.url));
  }

  const storedState = req.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/login?error=state_mismatch", req.url));
  }

  let from = "/";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    from = parsed.from ?? "/";
  } catch {
    // ignore malformed state
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

  let tokenData: GoogleTokenResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
  }

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
  }

  let googleUser: GoogleUserInfo;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    googleUser = await userRes.json();
  } catch {
    return NextResponse.redirect(new URL("/login?error=profile_fetch_failed", req.url));
  }

  if (!googleUser.email || !googleUser.email_verified) {
    return NextResponse.redirect(new URL("/login?error=email_not_verified", req.url));
  }

  let user = await findUserByGoogleId(googleUser.sub);

  if (!user) {
    const existing = await findUserByEmail(googleUser.email);
    if (existing) {
      await linkGoogleId(existing.id, googleUser.sub, googleUser.picture);
      user = existing;
    } else {
      user = await createGoogleUser(googleUser.email, googleUser.name, googleUser.sub, googleUser.picture);
    }
  }

  const token = await signToken({ userId: user.id, email: user.email, name: user.name });

  const redirectUrl = new URL(from.startsWith("/") ? from : "/", req.url);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set({ ...getSessionCookieOptions(), value: token });
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
