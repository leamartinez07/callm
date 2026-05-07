import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError, parseBody, forbidden } from "@/lib/response";
import Invite from "@/models/Invite";
import Room from "@/models/Room";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateInviteSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, updateInviteSchema);
  if (error) return error;

  try {
    await connectDB();

    const invite = await Invite.findById(id);
    if (!invite) return notFound("Invite not found");

    // Only recipient can respond to invite
    if (invite.to.toString() !== auth.sub) {
      return forbidden("Only the recipient can respond to this invite");
    }

    invite.status = data.status;

    // If accepted and type is room, add user to room members
    if (data.status === "accepted" && invite.type === "room" && invite.room) {
      const room = await Room.findById(invite.room);
      if (room) {
        if (!room.members.includes(invite.to)) {
          room.members.push(invite.to);
          await room.save();
        }
      }
    }

    await invite.save();

    await invite.populate([
      { path: "from", select: "name email avatar" },
      { path: "room", select: "name" },
    ]);

    return ok({ data: invite.toJSON() });
  } catch (e) {
    console.error("[invites PATCH]", e);
    return serverError();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();

    const invite = await Invite.findById(id);
    if (!invite) return notFound("Invite not found");

    // Only sender can delete a pending invite
    if (invite.from.toString() !== auth.sub) {
      return forbidden("Only the sender can cancel this invite");
    }

    if (invite.status !== "pending") {
      return forbidden("Can only cancel pending invites");
    }

    await invite.deleteOne();

    return ok({ data: { deleted: true } });
  } catch (e) {
    console.error("[invites DELETE]", e);
    return serverError();
  }
}
