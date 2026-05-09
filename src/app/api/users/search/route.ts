import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError, err } from "@/lib/response";
import User from "@/models/User";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return err("Query must be at least 2 characters");
  }

  try {
    await connectDB();

    const users = await User.find({
      $and: [
        { _id: { $ne: auth.sub } },
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: q.toLowerCase() },
          ],
        },
      ],
    })
      .select("_id name email avatar")
      .limit(10)
      .lean();

    return ok({ data: users });
  } catch (e) {
    console.error("[users/search GET]", e);
    return serverError();
  }
}
