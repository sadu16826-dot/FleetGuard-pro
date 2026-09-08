import { NextRequest, NextResponse } from "next/server";
import { isDevelopmentSession, SESSION_COOKIE } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const authenticated = isDevelopmentSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!authenticated && request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
  if (!authenticated) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/vehicles/:path*", "/api/vehicles/:path*"] };
