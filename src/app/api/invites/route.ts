import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError, parseBody, err, forbidden } from "@/lib/response";
import Invite from "@/models/Invite";
import Room from "@/models/Room";
import { z } from "zod";

const createInviteSchema = z.object({
  to: z.string(),
  type: z.enum(["friend", "room"]),
  room: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();

    const invites = await Invite.find({
      to: auth.sub,
      status: "pending",
    })
      .populate("from", "name email avatar")
      .populate("room", "name")
      .sort({ createdAt: -1 })
      .lean();

    return ok({ data: invites });
  } catch (e) {
    console.error("[invites GET]", e);
    return serverError();
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, createInviteSchema);
  if (error) return error;

  try {
    await connectDB();

    // For room invites, verify auth user is owner or member
    if (data.type === "room" && data.room) {
      const room = await Room.findById(data.room).select("owner members");
      if (!room) return notFound("Room not found");

      const isOwner = room.owner.toString() === auth.sub;
      const isMember = room.members.some((m) => m.toString() === auth.sub);

      if (!isOwner && !isMember) {
        return forbidden("You must be a room member or owner to invite");
      }
    }

    // Check for existing pending invite
    const existing = await Invite.findOne({
      from: auth.sub,
      to: data.to,
      type: data.type,
      status: "pending",
      ...(data.room && { room: data.room }),
    });

    if (existing) {
      return err("Invite already sent", 409);
    }

    const invite = await Invite.create({
      from: auth.sub,
      to: data.to,
      type: data.type,
      room: data.room || null,
    });

    await invite.populate([
      { path: "from", select: "name email avatar" },
      { path: "room", select: "name" },
    ]);

    return ok({ data: invite.toJSON(), status: 201 });
  } catch (e) {
    console.error("[invites POST]", e);
    return serverError();
  }
}
