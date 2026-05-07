import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, forbidden, notFound, serverError } from "@/lib/response";
import Message from "@/models/Message";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { z } from "zod";

type Params = { params: Promise<{ id: string; messageId: string }> };

const editSchema = z.object({
  content: z.string().min(1).max(4000),
});

// PATCH /api/rooms/:id/messages/:messageId — edit message
export async function PATCH(request: Request, { params }: Params) {
  const { id, messageId } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, error: "Invalid content" }), { status: 400 });
  }

  try {
    await connectDB();

    const message = await Message.findOne({ _id: messageId, room: id });
    if (!message) return notFound("Message not found");

    const senderId = typeof message.sender === "string" ? message.sender : message.sender._id?.toString();
    if (senderId !== auth.sub) return forbidden("You can only edit your own messages");

    message.content = parsed.data.content;
    message.editedAt = new Date();
    await message.save();

    const populated = await message.populate("sender", "name avatar");

    await pusherServer.trigger(CHANNELS.room(id), EVENTS.MESSAGE_EDITED, {
      message: populated.toJSON(),
    });

    return ok({ data: populated.toJSON() });
  } catch (e) {
    console.error("[message PATCH]", e);
    return serverError();
  }
}

// DELETE /api/rooms/:id/messages/:messageId — delete message
export async function DELETE(request: Request, { params }: Params) {
  const { id, messageId } = await params;
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    await connectDB();

    const message = await Message.findOne({ _id: messageId, room: id });
    if (!message) return notFound("Message not found");

    const senderId = typeof message.sender === "string" ? message.sender : message.sender._id?.toString();
    if (senderId !== auth.sub) return forbidden("You can only delete your own messages");

    await message.deleteOne();

    await pusherServer.trigger(CHANNELS.room(id), EVENTS.MESSAGE_DELETED, {
      messageId,
    });

    return ok({ data: { messageId } });
  } catch (e) {
    console.error("[message DELETE]", e);
    return serverError();
  }
}
