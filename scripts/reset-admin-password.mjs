import nextEnv from "@next/env";
import { randomBytes, scryptSync } from "node:crypto";
import prismaPackage from "../src/generated/prisma/index.js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const email = process.env.FLEETGUARD_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.FLEETGUARD_ADMIN_PASSWORD;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("Set FLEETGUARD_ADMIN_EMAIL to the existing administrator email.");
}

if (!password || password.length < 10) {
  throw new Error("Set FLEETGUARD_ADMIN_PASSWORD to a password of at least 10 characters.");
}

const { PrismaClient } = prismaPackage;
const db = new PrismaClient();

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(value, salt, 64).toString("hex")}`;
}

async function main() {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("No existing administrator account was found for the supplied email.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(password) },
  });

  console.log("Administrator password reset successfully.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Administrator password reset failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
