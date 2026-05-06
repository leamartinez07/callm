import { connectDB } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { parseBody, ok, err, conflict, serverError } from "@/lib/response";
import { registerSchema } from "@/lib/schemas";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { data, error } = await parseBody(request, registerSchema);
  if (error) return error;

  try {
    await connectDB();

    // Check email uniqueness
    const existing = await User.findOne({ email: data.email });
    if (existing) return conflict("Email already registered");

    // Hash password
    const hashed = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      avatar: data.avatar,
    });

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return ok({ data: { user: user.toJSON(), token }, status: 201 });
  } catch (e) {
    console.error("[register]", e);
    return serverError();
  }
}
