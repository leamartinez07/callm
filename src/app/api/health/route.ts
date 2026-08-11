import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ok, serviceUnavailable } from "@/lib/response";

export async function GET(request: NextRequest) {
  const base = { timestamp: new Date().toISOString(), version: "1.0.0" };
  if (request.nextUrl.searchParams.get("deep") !== "1") {
    return ok({ data: { ...base, status: "ok" } });
  }

  try {
    const mongoose = await connectDB();
    await mongoose.connection.db?.admin().ping();
    return ok({ data: { ...base, status: "ok", database: "connected" } });
  } catch (cause) {
    console.error("[health] database unavailable", cause);
    return serviceUnavailable("DATABASE_UNAVAILABLE");
  }
}
