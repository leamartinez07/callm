import { connectDB } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/response";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import User from "@/models/User";

type Params = { params: Promise<{ userId: string }> };

/**
 * POST /api/calls/[userId]
 * Sends a WebRTC signaling event to the target user's private channel.
 * Body: { event, payload }
 *   event: "offer" | "answer" | "ice" | "ended" | "rejected" | "busy"
 *   payload: depends on event
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  const { userId } = await params;
  const body = await request.json();
  const { event, payload } = body;

  if (!event || !payload) return badRequest("event and payload required");

  const eventMap: Record<string, string> = {
    offer:    EVENTS.CALL_OFFER,
    answer:   EVENTS.CALL_ANSWER,
    ice:      EVENTS.CALL_ICE,
    ended:    EVENTS.CALL_ENDED,
    rejected: EVENTS.CALL_REJECTED,
    busy:     EVENTS.CALL_BUSY,
  };

  if (!eventMap[event]) return badRequest("Invalid event");

  try {
    await connectDB();
    const target = await User.findById(userId).select("_id name");
    if (!target) return badRequest("User not found");

    // Trigger on target's private channel
    await pusherServer.trigger(
      CHANNELS.user(userId),
      eventMap[event],
      { ...payload, from: { _id: auth.sub, name: auth.name } }
    );

    return ok({ data: { sent: true } });
  } catch (e) {
    console.error("[calls POST]", e);
    return serverError();
  }
}
