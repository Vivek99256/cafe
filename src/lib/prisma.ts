import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "file:./dev.db";

  // Check if running on Vercel / AWS Lambda / Serverless Linux environment
  const isServerless =
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.LAMBDA_TASK_ROOT !== undefined ||
    (process.platform === "linux" && process.env.NODE_ENV === "production");

  if (url.startsWith("file:") && isServerless) {
    const targetDbPath = path.join("/tmp", "dev.db");

    try {
      if (!fs.existsSync(targetDbPath) || fs.statSync(targetDbPath).size === 0) {
        const bundledSrc = path.join(process.cwd(), "prisma", "dev.db");

        if (fs.existsSync(bundledSrc)) {
          console.log(`[Prisma Bridge] Copying bundled database to writable location ${targetDbPath}...`);
          fs.copyFileSync(bundledSrc, targetDbPath);
          fs.chmodSync(targetDbPath, 0o666);
        } else {
          console.warn("[Prisma Bridge] Bundled dev.db not found. Creating blank writable SQLite database in /tmp...");
          fs.writeFileSync(targetDbPath, "");
          fs.chmodSync(targetDbPath, 0o666);
        }
      } else {
        try {
          fs.chmodSync(targetDbPath, 0o666);
        } catch {
          // ignore
        }
      }

      url = `file:${targetDbPath}`;
      process.env.DATABASE_URL = url;
    } catch (bridgeErr) {
      console.error("[Prisma Bridge] Error initializing writable /tmp database:", bridgeErr);
    }
  }

  return url;
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolvedUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
