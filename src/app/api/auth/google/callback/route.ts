import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import User from "@/models/User";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

function clearOAuthCookies(response: NextResponse): NextResponse {
  const options = { path: "/api/auth/google", maxAge: 0 };
  response.cookies.set("callm_oauth_state", "", options);
  response.cookies.set("callm_oauth_verifier", "", options);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function redirect(appUrl: string, path: string): NextResponse {
  return clearOAuthCookies(NextResponse.redirect(`${appUrl}${path}`));
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request);
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("callm_oauth_state")?.value;
  const verifier = request.cookies.get("callm_oauth_verifier")?.value;

  if (error || !code) return redirect(appUrl, "/login?error=google_cancelled");
  if (!state || !expectedState || state !== expectedState || !verifier) {
    return redirect(appUrl, "/login?error=oauth_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  if (!clientId || !clientSecret) {
    return redirect(appUrl, "/login?error=google_not_configured");
  }

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
        code_verifier: verifier,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      console.error("[google/callback] token exchange failed", tokenRes.status);
      return redirect(appUrl, "/login?error=google_failed");
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (!userRes.ok) return redirect(appUrl, "/login?error=google_failed");

    const googleUser: GoogleUserInfo = await userRes.json();
    if (!googleUser.email || googleUser.email_verified !== true) {
      return redirect(appUrl, "/login?error=google_failed");
    }

    await connectDB();
    const email = googleUser.email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: googleUser.sub }, { email }],
    });

    if (user) {
      user.googleId ??= googleUser.sub;
      user.emailVerified = true;
      user.avatar ??= googleUser.picture;
      await user.save();
    } else {
      user = await User.create({
        name: googleUser.name.trim(),
        email,
        googleId: googleUser.sub,
        avatar: googleUser.picture,
        emailVerified: true,
      });
    }

    const jwt = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return redirect(appUrl, `/auth/callback#token=${encodeURIComponent(jwt)}`);
  } catch (cause) {
    console.error("[google/callback]", cause);
    return redirect(appUrl, "/login?error=google_failed");
  }
}
