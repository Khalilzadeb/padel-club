import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyVenueToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/google",
  "/open-games/",
  "/api/og",
  "/venue-admin/login",
  "/api/venue-admin/auth/login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Venue admin routes — separate session
  if (pathname.startsWith("/venue-admin") || pathname.startsWith("/api/venue-admin")) {
    const venueToken = req.cookies.get("venue_session")?.value;
    const venueSession = venueToken ? await verifyVenueToken(venueToken) : null;
    if (!venueSession) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/venue-admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Regular user routes
  const token = req.cookies.get("padel_session")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon-|manifest.json|api/og).*)"],
};
