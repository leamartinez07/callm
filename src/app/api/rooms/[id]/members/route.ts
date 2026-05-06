import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, forbidden, notFound, err, serverError } from "@/lib/response";
import Room from "@/models/Room";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

type Params = { params: { id: string } };

// GET /api/rooms/:id/members — list members
export async function GET(_: Request, { params }: Params) {
  try {
    await connectDB();
    const room = await Room.findById(params.id).populate("members", "name avatar email");
    if (!room) return notFound("Room not found");
    return ok({ data: room.members });
  } catch (e) {
    console.error("[members GET]", e);
    return serverError();
  }
}

// POST /api/rooms/:id/members — join room
export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();
    const room = await Room.findById(params.id);
    if (!room) return notFound("Room not found");
    if (room.type === "private") return forbidden("Cannot join a private room without an invite");

    const alreadyMember = room.members.some((m) => m.toString() === auth.sub);
    if (alreadyMember) return err("Already a member", 409);

    room.members.push(auth.sub as unknown as typeof room.members[0]);
    await room.save();

    await pusherServer.trigger(CHANNELS.room(params.id), EVENTS.MEMBER_JOINED, {
      userId: auth.sub,
      name: auth.name,
    });

    return ok({ data: { joined: true } });
  } catch (e) {
    console.error("[members POST]", e);
    return serverError();
  }
}

// DELETE /api/rooms/:id/members — leave room
export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();
    const room = await Room.findById(params.id);
    if (!room) return notFound("Room not found");

    if (room.owner.toString() === auth.sub) {
      return err("Owner cannot leave their own room. Delete the room instead.", 400);
    }

    room.members = room.members.filter((m) => m.toString() !== auth.sub);
    await room.save();

    await pusherServer.trigger(CHANNELS.room(params.id), EVENTS.MEMBER_LEFT, {
      userId: auth.sub,
    });

    return ok({ data: { left: true } });
  } catch (e) {
    console.error("[members DELETE]", e);
    return serverError();
  }
}
