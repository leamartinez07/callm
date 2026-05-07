import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import User from "@/models/User";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_cancelled`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  try {
    // Exchange code for tokens
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

    if (!tokenRes.ok) {
      console.error("[google/callback] token exchange failed", await tokenRes.text());
      return NextResponse.redirect(`${appUrl}/login?error=google_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=google_failed`);
    }

    const googleUser: GoogleUserInfo = await userRes.json();

    await connectDB();

    // Find or create user
    let user = await User.findOne({
      $or: [{ googleId: googleUser.sub }, { email: googleUser.email }],
    });

    if (user) {
      // Link Google ID if they previously registered via email
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        if (googleUser.email_verified) user.emailVerified = true;
        await user.save();
      }
    } else {
      // New user via Google
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        avatar: googleUser.picture,
        emailVerified: googleUser.email_verified ?? true,
      });
    }

    const jwt = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Pass token to client via URL param — the /chat page will pick it up
    return NextResponse.redirect(`${appUrl}/auth/callback?token=${jwt}`);
  } catch (e) {
    console.error("[google/callback]", e);
    return NextResponse.redirect(`${appUrl}/login?error=google_failed`);
  }
}
