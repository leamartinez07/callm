import { connectDB, isDatabaseUnavailable } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { parseBody, ok, unauthorized, serverError, serviceUnavailable } from "@/lib/response";
import { loginSchema } from "@/lib/schemas";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  try {
    await connectDB();

    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) return unauthorized("INVALID_CREDENTIALS");

    if (!user.password) return unauthorized("GOOGLE_ACCOUNT_REQUIRED");

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return unauthorized("INVALID_CREDENTIALS");

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return ok({ data: { user: user.toJSON(), token } });
  } catch (e) {
    console.error("[login]", e);
    if (isDatabaseUnavailable(e)) return serviceUnavailable("AUTH_UNAVAILABLE");
    return serverError();
  }
}
