import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { parseBody, ok, unauthorized, notFound, serverError } from "@/lib/response";
import { z } from "zod";
import User from "@/models/User";

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatar: z.string().url().optional(),
});

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();
    const user = await User.findById(auth.sub);
    if (!user) return notFound("User not found");
    return ok({ data: user.toJSON() });
  } catch (e) {
    console.error("[me GET]", e);
    return serverError();
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, updateSchema);
  if (error) return error;

  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(auth.sub, data, { new: true });
    if (!user) return notFound("User not found");
    return ok({ data: user.toJSON() });
  } catch (e) {
    console.error("[me PATCH]", e);
    return serverError();
  }
}
