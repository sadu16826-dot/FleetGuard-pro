import "server-only";
import { Prisma, PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchema?: string;
};
// Fast Refresh preserves globals even after Prisma regenerates new model delegates.
const schema = JSON.stringify(Prisma.dmmf.datamodel);
const cachedClient = globalForPrisma.prismaSchema === schema
  ? globalForPrisma.prisma
  : undefined;

export const db = cachedClient ?? new PrismaClient({
  transactionOptions: { maxWait: 10000, timeout: 20000 },
});

if (globalForPrisma.prisma && globalForPrisma.prisma !== db) {
  void globalForPrisma.prisma.$disconnect().catch((error: unknown) => {
    console.error("Unable to disconnect the stale Prisma client", error);
  });
}
globalForPrisma.prisma = db;
globalForPrisma.prismaSchema = schema;
