import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultGraphicsConfig, parseGraphicsConfig } from "@/lib/graphics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const [settings, sections, posts, popup, graphics] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "primary" } }),
      prisma.homepageSection.findMany({
        where: { isEnabled: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.post.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  status: "PUBLISHED",
                  OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
                },
                { status: "SCHEDULED", publishedAt: { lte: now } },
              ],
            },
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          ],
        },
        orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { publishedAt: "desc" }],
        take: 8,
      }),
      prisma.popup.findFirst({
        where: {
          status: "PUBLISHED",
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          ],
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.graphicsConfig.findUnique({ where: { id: "primary" } }),
    ]);

    return NextResponse.json({
      settings,
      sections,
      posts,
      popup,
      graphics: parseGraphicsConfig(graphics?.publishedJson || JSON.stringify(defaultGraphicsConfig)),
    });
  } catch (error) {
    console.error("Public homepage content load error:", error);
    return NextResponse.json({ error: "Failed to load homepage content" }, { status: 500 });
  }
}
