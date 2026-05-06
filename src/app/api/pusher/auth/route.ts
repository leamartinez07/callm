import { getAuthUser } from "@/lib/auth";
import { unauthorized, err } from "@/lib/response";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

// Pusher presence channel auth
// Called automatically by pusher-js for presence- channels
export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channel = params.get("channel_name");

    if (!socketId || !channel) return err("Missing socket_id or channel_name");

    const presenceData = {
      user_id: auth.sub,
      user_info: { name: auth.name, email: auth.email },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);

    return NextResponse.json(authResponse);
  } catch (e) {
    console.error("[pusher auth]", e);
    return err("Pusher auth failed", 500);
  }
}
