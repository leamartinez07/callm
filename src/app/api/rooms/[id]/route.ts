import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { parseBody, ok, unauthorized, forbidden, notFound, serverError } from "@/lib/response";
import { updateRoomSchema } from "@/lib/schemas";
import Room from "@/models/Room";
import Message from "@/models/Message";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectDB();
    const room = await Room.findById(id)
      .populate("owner", "name avatar")
      .populate("members", "name avatar");

    if (!room) return notFound("Room not found");
    return ok({ data: room.toJSON() });
  } catch (e) {
    console.error("[room GET]", e);
    return serverError();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, updateRoomSchema);
  if (error) return error;

  try {
    await connectDB();
    const room = await Room.findById(id);
    if (!room) return notFound("Room not found");
    if (room.owner.toString() !== auth.sub) return forbidden("Only the room owner can update it");

    Object.assign(room, data);
    await room.save();

    const populated = await room.populate("owner", "name avatar");
    return ok({ data: populated.toJSON() });
  } catch (e) {
    console.error("[room PATCH]", e);
    return serverError();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();
    const room = await Room.findById(id);
    if (!room) return notFound("Room not found");
    if (room.owner.toString() !== auth.sub) return forbidden("Only the room owner can delete it");

    await Promise.all([
      room.deleteOne(),
      Message.deleteMany({ room: id }),
    ]);

    return ok({ data: { deleted: true } });
  } catch (e) {
    console.error("[room DELETE]", e);
    return serverError();
  }
}
