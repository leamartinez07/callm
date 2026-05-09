import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/response";
import Room from "@/models/Room";
import User from "@/models/User";

// GET /api/dms — list all DM conversations for the current user
export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();

    const dms = await Room.find({
      type: "direct",
      members: auth.sub,
    })
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 });

    return ok({ data: dms });
  } catch (e) {
    console.error("[dms GET]", e);
    return serverError();
  }
}

// POST /api/dms — create or get existing DM with { userId }
export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return badRequest("userId is required");
    if (userId === auth.sub) return badRequest("Cannot DM yourself");

    await connectDB();

    // Check target user exists
    const target = await User.findById(userId).select("name email avatar");
    if (!target) return badRequest("User not found");

    // Check for existing DM room
    const existing = await Room.findOne({
      type: "direct",
      members: { $all: [auth.sub, userId], $size: 2 },
    }).populate("members", "name email avatar");

    if (existing) return ok({ data: existing });

    // Create new DM room
    const dmName = `dm-${[auth.sub, userId].sort().join("-")}`;
    const dm = await Room.create({
      name: dmName,
      slug: `dm-${Math.random().toString(36).slice(2, 10)}`,
      type: "direct",
      owner: auth.sub,
      members: [auth.sub, userId],
    });

    const populated = await Room.findById(dm._id).populate("members", "name email avatar");
    return ok({ data: populated, status: 201 });
  } catch (e) {
    console.error("[dms POST]", e);
    return serverError();
  }
}
