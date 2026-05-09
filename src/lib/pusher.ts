import Pusher from "pusher";
import PusherJS from "pusher-js";

// ── Server-side Pusher ────────────────────────────────────────────────────────
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
      channelAuthorization: {
        transport: "ajax",
        endpoint: "/api/pusher/auth",
        headersProvider: () => ({
          Authorization: `Bearer ${
            typeof window !== "undefined"
              ? (localStorage.getItem("callm_token") ?? "")
              : ""
          }`,
        }),
      },
    });
  }
  return pusherClientInstance;
}

// ── Channel name helpers ──────────────────────────────────────────────────────
export const CHANNELS = {
  room:   (roomId:  string) => `presence-room-${roomId}`,
  user:   (userId:  string) => `private-user-${userId}`,   // for call signaling
  global: "global-rooms",
} as const;

export const EVENTS = {
  // Messages
  NEW_MESSAGE:     "new-message",
  MESSAGE_EDITED:  "message-edited",
  MESSAGE_DELETED: "message-deleted",
  // Rooms
  ROOM_CREATED:    "room-created",
  MEMBER_JOINED:   "member-joined",
  MEMBER_LEFT:     "member-left",
  // WebRTC calls
  CALL_OFFER:      "call-offer",
  CALL_ANSWER:     "call-answer",
  CALL_ICE:        "call-ice",
  CALL_ENDED:      "call-ended",
  CALL_REJECTED:   "call-rejected",
  CALL_BUSY:       "call-busy",
} as const;
