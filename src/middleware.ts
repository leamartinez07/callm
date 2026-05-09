import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, extractBearerToken } from "@/lib/auth";

const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/google",   // Google OAuth initiation + callback
  "/api/auth/verify",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow preflight
  if (request.method === "OPTIONS") return NextResponse.next();

  // Only protect /api routes
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Verify JWT
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
