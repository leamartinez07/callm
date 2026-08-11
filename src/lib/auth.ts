import { SignJWT, jwtVerify } from "jose";
import type { JwtPayload } from "@/types";

function getSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JwtPayload;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function getAuthUser(request: Request): Promise<JwtPayload | null> {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
