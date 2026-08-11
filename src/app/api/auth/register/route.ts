import { connectDB, isDatabaseUnavailable } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { parseBody, ok, conflict, serverError, serviceUnavailable } from "@/lib/response";
import { registerSchema } from "@/lib/schemas";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";

export async function POST(request: Request) {
  const { data, error } = await parseBody(request, registerSchema);
  if (error) return error;

  try {
    await connectDB();

    // Check email uniqueness
    const existing = await User.findOne({ email: data.email });
    if (existing) return conflict("EMAIL_ALREADY_REGISTERED");

    // Hash password
    const hashed = await bcrypt.hash(data.password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      avatar: data.avatar,
      emailVerified: false,
      verificationToken,
    });

    const emailVerificationSent = isEmailConfigured();
    if (emailVerificationSent) {
      sendVerificationEmail(data.email, data.name, verificationToken, getAppUrl(request)).catch(
        (e) => console.error("[verify email]", e)
      );
    }

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return ok({ data: { user: user.toJSON(), token, emailVerificationSent }, status: 201 });
  } catch (e) {
    console.error("[register]", e);
    if (typeof e === "object" && e && "code" in e && e.code === 11000) {
      return conflict("EMAIL_ALREADY_REGISTERED");
    }
    if (isDatabaseUnavailable(e)) return serviceUnavailable("AUTH_UNAVAILABLE");
    return serverError();
  }
}
