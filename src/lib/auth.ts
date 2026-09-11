import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fleetguard_session";

const developmentUser = {
  id: "dev-admin",
  name: "Sadu Admin",
  username: "sadu",
  role: "ADMIN" as const,
};

export function validateDevelopmentCredentials(username: string, password: string) {
  if (username === "sadu" && password === "sadu1234") return developmentUser;
  return null;
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production")
    throw new Error("SESSION_SECRET is required in production.");
  return "fleetguard-development-session-secret";
}

export function createDevelopmentSession(userId: string) {
  const payload = Buffer.from(userId).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function sessionUserId(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return Buffer.from(payload, "base64url").toString();
}

export function isDevelopmentSession(value?: string) {
  return sessionUserId(value) !== null;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, digest] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
