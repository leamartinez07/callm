import { ok } from "@/lib/response";

export async function GET() {
  return ok({ data: { status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" } });
}
