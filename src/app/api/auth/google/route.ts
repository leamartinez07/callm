import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";

const OAUTH_COOKIE_AGE = 10 * 60;

function base64Url(value: Buffer): string {
  return value.toString("base64url");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = getAppUrl(request);

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const state = base64Url(crypto.randomBytes(32));
  const verifier = base64Url(crypto.randomBytes(48));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge: OAUTH_COOKIE_AGE,
  };

  response.cookies.set("callm_oauth_state", state, cookieOptions);
  response.cookies.set("callm_oauth_verifier", verifier, cookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
