import { NextResponse } from "next/server";
import { createDevelopmentSession, SESSION_COOKIE, validateDevelopmentCredentials } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string; remember?: boolean };
  const user = validateDevelopmentCredentials(body.username?.trim() ?? "", body.password ?? "");

  if (!user) return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });

  const company = await db.company.upsert({ where: { id: "development-company" }, update: {}, create: { id: "development-company", name: "FleetGuard Operations" } });
  await db.user.upsert({ where: { id: user.id }, update: { name: user.name, companyId: company.id, role: user.role }, create: { id: user.id, companyId: company.id, name: user.name, email: "sadu@fleetguard.local", passwordHash: "development-session-auth", role: user.role } });

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, createDevelopmentSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: body.remember ? 60 * 60 * 24 * 30 : undefined,
  });
  return response;
}
