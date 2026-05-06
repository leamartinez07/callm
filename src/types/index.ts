export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface IRoom {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  type: "public" | "private";
  owner: IUser | string;
  members: Array<IUser | string>;
  memberCount: number;
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
  type: "text" | "system";
  editedAt?: string;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;   // user _id
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
