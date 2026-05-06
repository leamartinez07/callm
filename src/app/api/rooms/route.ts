import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { parseBody, ok, unauthorized, serverError } from "@/lib/response";
import { createRoomSchema, roomQuerySchema } from "@/lib/schemas";
import Room from "@/models/Room";
import Message from "@/models/Message";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const params = roomQuerySchema.parse({
    search: searchParams.get("search") ?? undefined,
    type: searchParams.get("type") ?? "all",
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (params.type !== "all") filter.type = params.type;
    if (params.search) filter.name = { $regex: params.search, $options: "i" };

    // Show public rooms + private rooms where user is member
    filter.$or = [
      { type: "public" },
      { type: "private", members: auth.sub },
    ];

    const skip = (params.page - 1) * params.limit;

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate("owner", "name avatar")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(params.limit)
        .lean(),
      Room.countDocuments(filter),
    ]);

    return ok({
      data: rooms,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(total / params.limit),
      },
    });
  } catch (e) {
    console.error("[rooms GET]", e);
    return serverError();
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, createRoomSchema);
  if (error) return error;

  try {
    await connectDB();

    const room = await Room.create({
      ...data,
      owner: auth.sub,
      members: [auth.sub],
    });

    const populated = await room.populate("owner", "name avatar");

    // Notify all clients about new room
    await pusherServer.trigger(CHANNELS.global, EVENTS.ROOM_CREATED, {
      room: populated.toJSON(),
    });

    return ok({ data: populated.toJSON(), status: 201 });
  } catch (e) {
    console.error("[rooms POST]", e);
    return serverError();
  }
}
