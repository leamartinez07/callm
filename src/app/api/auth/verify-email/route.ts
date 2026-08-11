import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getAppUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const appUrl = getAppUrl(request);

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?verified=error`);
  }

  try {
    await connectDB();

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?verified=error`);
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.redirect(`${appUrl}/login?verified=1`);
  } catch (e) {
    console.error("[verify-email]", e);
    return NextResponse.redirect(`${appUrl}/login?verified=error`);
  }
}
