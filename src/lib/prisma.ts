// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Singleton to prevent multiple instances during dev hot reload
const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Only persist singleton in dev
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
