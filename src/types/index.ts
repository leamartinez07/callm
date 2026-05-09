export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface IRoom {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  type: "public" | "private" | "direct";
  owner: IUser | string;
  members: Array<IUser | string>;
  memberCount: number;
  image?: string;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  content: string;
  room: string;
  sender: IUser;
  type: "text" | "system" | "image" | "video" | "file";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  editedAt?: string;
  createdAt: string;
}

export interface IInvite {
  _id: string;
  from: IUser;
  to: IUser;
  room?: IRoom;
  type: "friend" | "room";
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface IFriend {
  _id: string;
  user: IUser;
  since: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── WebRTC Call types ─────────────────────────────────────────────────────────
export type CallType = "audio" | "video";
export type CallState = "idle" | "calling" | "incoming" | "active" | "ended";

export interface CallOffer {
  callId: string;
  from: IUser;
  type: CallType;
  sdp: RTCSessionDescriptionInit;
}

export interface CallAnswer {
  callId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface CallIcePayload {
  callId: string;
  candidate: RTCIceCandidateInit;
}
