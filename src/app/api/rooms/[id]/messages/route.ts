import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { parseBody, ok, unauthorized, forbidden, notFound, serverError } from "@/lib/response";
import { sendMessageSchema, messageQuerySchema } from "@/lib/schemas";
import Room from "@/models/Room";
import Message from "@/models/Message";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

// GET /api/rooms/:id/messages — cursor-based pagination (newest first)
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const query = messageQuerySchema.parse({
    before: searchParams.get("before") ?? undefined,
    limit: searchParams.get("limit") ?? 30,
  });

  try {
    await connectDB();

    const room = await Room.findById(id).select("members type");
    if (!room) return notFound("Room not found");

    // For private rooms, verify membership
    if (
      room.type === "private" &&
      !room.members.some((m) => m.toString() === auth.sub)
    ) {
      return forbidden("You are not a member of this room");
    }

    const filter: Record<string, unknown> = { room: id };

    if (query.before && mongoose.Types.ObjectId.isValid(query.before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(query.before) };
    }

    const messages = await Message.find(filter)
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .lean();

    // Return oldest-first for display
    return ok({
      data: messages.reverse(),
      meta: { hasMore: messages.length === query.limit },
    });
  } catch (e) {
    console.error("[messages GET]", e);
    return serverError();
  }
}

// POST /api/rooms/:id/messages — send a message
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { data, error } = await parseBody(request, sendMessageSchema);
  if (error) return error;

  try {
    await connectDB();

    const room = await Room.findById(id);
    if (!room) return notFound("Room not found");

    // Check membership
    const isMember = room.members.some((m) => m.toString() === auth.sub);
    if (!isMember) return forbidden("Join the room first to send messages");

    // Parse content to detect media types
    let messageType: "text" | "system" | "image" | "video" | "file" = "text";
    let mediaUrl: string | undefined;
    let fileName: string | undefined;

    if (data.content.startsWith("[image:")) {
      messageType = "image";
      const match = data.content.match(/^\[image:(.+?)\]/);
      if (match) mediaUrl = match[1];
    } else if (data.content.startsWith("[video:")) {
      messageType = "video";
      const match = data.content.match(/^\[video:(.+?)\]/);
      if (match) mediaUrl = match[1];
    } else if (data.content.startsWith("[file:")) {
      messageType = "file";
      const match = data.content.match(/^\[file:(.+?):(.+?)\]/);
      if (match) {
        fileName = match[1];
        mediaUrl = match[2];
      }
    }

    const message = await Message.create({
      content: data.content,
      room: id,
      sender: auth.sub,
      type: messageType,
      mediaUrl,
      fileName,
    });

    const populated = await message.populate("sender", "name avatar");

    // Update room's lastMessage
    await Room.findByIdAndUpdate(id, {
      lastMessage: {
        content: data.content,
        sender: auth.name,
        createdAt: new Date(),
      },
      updatedAt: new Date(),
    });

    // Trigger Pusher event for real-time delivery
    await pusherServer.trigger(
      CHANNELS.room(id),
      EVENTS.NEW_MESSAGE,
      { message: populated.toJSON() }
    );

    return ok({ data: populated.toJSON(), status: 201 });
  } catch (e) {
    console.error("[messages POST]", e);
    return serverError();
  }
}
