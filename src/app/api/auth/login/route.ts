import { NextResponse } from "next/server";
import {
  createDevelopmentSession,
  SESSION_COOKIE,
  validateDevelopmentCredentials,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { databaseErrorCategory, logServerError } from "@/lib/database-errors";

type LoginBody = { username?: unknown; password?: unknown; remember?: unknown };

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json() as LoginBody;
  } catch {
    return NextResponse.json({ message: "Enter a valid username and password." }, { status: 400 });
  }

  const login = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!login || !password)
    return NextResponse.json({ message: "Username and password are required." }, { status: 400 });

  try {
    const legacyUser = validateDevelopmentCredentials(login, password);
    if (legacyUser) {
      const company = await db.company.upsert({ where: { id: "development-company" }, update: {}, create: { id: "development-company", name: "FleetGuard Operations" } });
      await db.user.upsert({
        where: { id: legacyUser.id },
        update: { name: legacyUser.name, companyId: company.id, role: legacyUser.role, active: true },
        create: { id: legacyUser.id, companyId: company.id, name: legacyUser.name, email: "sadu@fleetguard.local", passwordHash: "development-session-auth", role: legacyUser.role, active: true },
      });
    }

    const user = legacyUser
      ? await db.user.findUnique({ where: { id: legacyUser.id } })
      : await db.user.findUnique({ where: { email: login.toLowerCase() } });

    if (!user || (!legacyUser && !verifyPassword(password, user.passwordHash)))
      return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
    if (!user.active)
      return NextResponse.json({ message: "Your account is inactive. Please contact an administrator." }, { status: 403 });

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const response = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
    response.cookies.set(SESSION_COOKIE, createDevelopmentSession(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: body.remember === true ? 60 * 60 * 24 * 30 : undefined,
    });
    return response;
  } catch (error) {
    logServerError("POST /api/auth/login", error);
    const category = databaseErrorCategory(error);
    if (category === "unavailable")
      return NextResponse.json({ message: "Unable to sign in right now. Please try again." }, { status: 503 });
    if (category === "schema")
      return NextResponse.json({ message: "Unable to sign in right now. Please contact an administrator." }, { status: 503 });
    return NextResponse.json({ message: "Unable to sign in. Please try again." }, { status: 500 });
  }
}
