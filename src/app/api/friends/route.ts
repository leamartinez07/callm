import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, badRequest, conflict, serverError } from "@/lib/response";
import Invite from "@/models/Invite";
import User from "@/models/User";

// GET /api/friends — list accepted friends
export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();

    const accepted = await Invite.find({
      $or: [{ from: auth.sub }, { to: auth.sub }],
      type: "friend",
      status: "accepted",
    })
      .populate("from", "name email avatar bio")
      .populate("to", "name email avatar bio")
      .sort({ updatedAt: -1 });

    // Normalize: always return the "other" user
    const friends = accepted.map((inv) => {
      const fromUser = inv.from as unknown as { _id: { toString(): string }; name: string };
      const isFrom = fromUser._id.toString() === auth.sub;
      return {
        _id: inv._id,
        user: isFrom ? inv.to : inv.from,
        since: inv.updatedAt,
      };
    });

    return ok({ data: friends });
  } catch (e) {
    console.error("[friends GET]", e);
    return serverError();
  }
}

// POST /api/friends — send friend request { userId }
export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return badRequest("userId is required");
    if (userId === auth.sub) return badRequest("Cannot add yourself");

    await connectDB();

    const target = await User.findById(userId).select("name email avatar");
    if (!target) return badRequest("User not found");

    // Check if invite already exists in any direction
    const existing = await Invite.findOne({
      $or: [
        { from: auth.sub, to: userId, type: "friend" },
        { from: userId, to: auth.sub, type: "friend" },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") return conflict("Already friends");
      if (existing.status === "pending") return conflict("Friend request already sent");
      // If declined, allow re-send
      existing.status = "pending";
      existing.from = auth.sub as unknown as typeof existing.from;
      existing.to = userId;
      await existing.save();
      return ok({ data: existing });
    }

    const invite = await Invite.create({
      from: auth.sub,
      to: userId,
      type: "friend",
      status: "pending",
    });

    return ok({ data: invite, status: 201 });
  } catch (e) {
    console.error("[friends POST]", e);
    return serverError();
  }
}
