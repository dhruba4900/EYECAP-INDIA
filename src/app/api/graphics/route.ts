import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultGraphicsConfig, parseGraphicsConfig } from "@/lib/graphics";

export async function GET() {
  try {
    const record = await prisma.graphicsConfig.findUnique({ where: { id: "primary" } });
    return NextResponse.json({
      config: parseGraphicsConfig(record?.publishedJson || JSON.stringify(defaultGraphicsConfig)),
      version: record?.version || 1,
    });
  } catch (error) {
    console.error("Public graphics configuration load error:", error);
    return NextResponse.json({ error: "Failed to load graphics configuration" }, { status: 500 });
  }
}
