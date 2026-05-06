import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  avatar: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createRoomSchema = z.object({
  name: z.string().min(2, "Room name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  type: z.enum(["public", "private"]).default("public"),
});

export const updateRoomSchema = createRoomSchema.partial();

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const roomQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(["public", "private", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const messageQuerySchema = z.object({
  before: z.string().optional(), // message _id for cursor pagination
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
