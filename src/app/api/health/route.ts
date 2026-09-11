import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logServerError } from "@/lib/database-errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", service: "fleetguard-pro", database: "reachable" });
  } catch (error) {
    logServerError("GET /api/health", error);
    return NextResponse.json({ status: "degraded", service: "fleetguard-pro", database: "unavailable" }, { status: 503 });
  }
}
