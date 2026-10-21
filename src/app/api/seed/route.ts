import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runDatabaseSeed } from "@/lib/seed-service";

export async function GET() {
  try {
    const result = await runDatabaseSeed(prisma);
    return NextResponse.json({
      success: true,
      message: result.message,
      demoAccounts: {
        superAdmin: "admin@cafesaas.com / Admin@1234",
        cafeOwner: "owner@auracafe.com / Owner@1234",
        cafeManager: "manager@auracafe.com / Manager@1234",
        kitchen: "kitchen@auracafe.com / Kitchen@1234",
        bellaOwner: "owner@bellacucina.com / Bella@1234",
      },
    });
  } catch (err: unknown) {
    console.error("API Seed error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to seed database",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
