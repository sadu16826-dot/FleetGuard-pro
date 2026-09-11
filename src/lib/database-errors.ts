import { Prisma } from "@/generated/prisma";

const unavailableCodes = new Set(["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"]);
const schemaCodes = new Set(["P2021", "P2022"]);

export type DatabaseErrorCategory = "unavailable" | "schema" | "unexpected";

export function databaseErrorCategory(error: unknown): DatabaseErrorCategory {
  const code = safeDatabaseErrorCode(error);
  if (code && unavailableCodes.has(code)) return "unavailable";
  if (code && schemaCodes.has(code)) return "schema";
  if (error instanceof Prisma.PrismaClientInitializationError) return "unavailable";
  return "unexpected";
}

export function safeDatabaseErrorCode(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (error instanceof Prisma.PrismaClientInitializationError) return error.errorCode;
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; errorCode?: unknown };
    if (typeof candidate.code === "string") return candidate.code;
    if (typeof candidate.errorCode === "string") return candidate.errorCode;
  }
  return undefined;
}

export function logServerError(endpoint: string, error: unknown) {
  console.error("Server request failed", {
    endpoint,
    category: databaseErrorCategory(error),
    prismaCode: safeDatabaseErrorCode(error),
    timestamp: new Date().toISOString(),
    errorName: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown server error",
  });
}
