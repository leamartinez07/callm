import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError, parseBody } from "@/lib/response";
import User from "@/models/User";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(200).optional(),
  avatar: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();
    const user = await User.findById(auth.sub).select("-password");
    if (!user) return notFound("User not found");
    return ok({ data: user.toJSON() });
  } catch (e) {
    console.error("[users/me GET]", e);
    return serverError();
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, updateUserSchema);
  if (error) return error;

  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(auth.sub, data, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return notFound("User not found");
    return ok({ data: user.toJSON() });
  } catch (e) {
    console.error("[users/me PATCH]", e);
    return serverError();
  }
}
