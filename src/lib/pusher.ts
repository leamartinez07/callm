import Pusher from "pusher";
import PusherJS from "pusher-js";

// ── Server-side Pusher (for triggering events from API routes) ────────────────
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// ── Client-side Pusher singleton ──────────────────────────────────────────────
let pusherClientInstance: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? localStorage.getItem("chatflow_token") ?? ""
              : ""
          }`,
        },
      },
    });
  }
  return pusherClientInstance;
}

// ── Channel name helpers ──────────────────────────────────────────────────────
export const CHANNELS = {
  room: (roomId: string) => `presence-room-${roomId}`,
  global: "global-rooms",
} as const;

export const EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_EDITED: "message-edited",
  MESSAGE_DELETED: "message-deleted",
  ROOM_CREATED: "room-created",
  MEMBER_JOINED: "member-joined",
  MEMBER_LEFT: "member-left",
} as const;
