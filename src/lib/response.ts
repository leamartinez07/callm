import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

type SuccessOptions<T> = {
  data: T;
  status?: number;
  meta?: Record<string, unknown>;
};

export function ok<T>({ data, status = 200, meta }: SuccessOptions<T>) {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) }, { status });
}

export function err(error: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export const unauthorized = (msg = "Unauthorized") => err(msg, 401);
export const forbidden = (msg = "Forbidden") => err(msg, 403);
export const notFound = (msg = "Not found") => err(msg, 404);
export const serverError = (msg = "Internal server error") => err(msg, 500);
export const conflict = (msg = "Conflict") => err(msg, 409);

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        data: null,
        error: err("Validation error", 422, e.flatten().fieldErrors),
      };
    }
    return { data: null, error: err("Invalid JSON body") };
  }
}
