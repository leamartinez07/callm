import { connectDB } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { parseBody, ok, err, unauthorized, serverError } from "@/lib/response";
import { loginSchema } from "@/lib/schemas";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  try {
    await connectDB();

    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) return unauthorized("Invalid credentials");

    const valid = await bcrypt.compare(data.password, user.password as string);
    if (!valid) return unauthorized("Invalid credentials");

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return ok({ data: { user: user.toJSON(), token } });
  } catch (e) {
    console.error("[login]", e);
    return serverError();
  }
}
