import { NextResponse } from "next/server";
import {
  createDevelopmentSession,
  missingAuthenticationEnvironmentVariable,
  SESSION_COOKIE,
  validateDevelopmentCredentials,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { databaseErrorCategory, logServerError } from "@/lib/database-errors";

type LoginBody = { username?: unknown; password?: unknown; remember?: unknown };

export const runtime = "nodejs";

function logAuthenticationFailure(event: string, details: Record<string, unknown> = {}) {
  console.error("Authentication failure", {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

async function findUserForLogin(login: string) {
  const normalizedLogin = login.toLowerCase();
  const emailUser = await db.user.findUnique({ where: { email: normalizedLogin } });
  if (emailUser || normalizedLogin.includes("@")) return emailUser;

  const usernameMatches = await db.user.findMany({
    where: { email: { startsWith: `${normalizedLogin}@`, mode: "insensitive" } },
    take: 2,
  });
  return usernameMatches.length === 1 ? usernameMatches[0] : null;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json() as LoginBody;
  } catch {
    return NextResponse.json(
      { message: "Enter a valid username and password.", code: "AUTH_INVALID_REQUEST" },
      { status: 400 },
    );
  }

  const login = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!login || !password)
    return NextResponse.json(
      { message: "Username and password are required.", code: "AUTH_VALIDATION_ERROR" },
      { status: 400 },
    );

  const missingVariable = missingAuthenticationEnvironmentVariable();
  if (missingVariable) {
    logAuthenticationFailure("AUTH_ENVIRONMENT_ERROR", { missingVariable });
    return NextResponse.json(
      {
        message: "Unable to sign in right now. Please contact an administrator.",
        code: missingVariable === "DATABASE_URL"
          ? "AUTH_DATABASE_URL_MISSING"
          : "AUTH_SESSION_SECRET_MISSING",
      },
      { status: 503 },
    );
  }

  let user;
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

    user = legacyUser
      ? await db.user.findUnique({ where: { id: legacyUser.id } })
      : await findUserForLogin(login);

    if (!user || (!legacyUser && !verifyPassword(password, user.passwordHash))) {
      console.warn("Authentication rejected", {
        event: "AUTH_INVALID_CREDENTIALS",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { message: "Invalid username or password.", code: "AUTH_INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }
    if (!user.active)
      return NextResponse.json(
        { message: "Your account is inactive. Please contact an administrator.", code: "AUTH_ACCOUNT_INACTIVE" },
        { status: 403 },
      );

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  } catch (error) {
    const category = databaseErrorCategory(error);
    logAuthenticationFailure("AUTH_LOGIN_DATABASE_ERROR", {
      category,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    logServerError("POST /api/auth/login", error);
    if (category === "unavailable")
      return NextResponse.json(
        { message: "Unable to sign in right now. Please try again.", code: "AUTH_DATABASE_UNAVAILABLE" },
        { status: 503 },
      );
    if (category === "schema")
      return NextResponse.json(
        { message: "Unable to sign in right now. Please contact an administrator.", code: "AUTH_DATABASE_SCHEMA_ERROR" },
        { status: 503 },
      );
    return NextResponse.json(
      { message: "Unable to sign in. Please try again.", code: "AUTH_LOGIN_ERROR" },
      { status: 500 },
    );
  }

  try {
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
    logAuthenticationFailure("AUTH_SESSION_ERROR", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { message: "Unable to sign in. Please try again.", code: "AUTH_SESSION_ERROR" },
      { status: 500 },
    );
  }
}
