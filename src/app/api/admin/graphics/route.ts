import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { defaultGraphicsConfig, graphicsConfigSchema, parseGraphicsConfig } from "@/lib/graphics";

async function ensureConfig() {
  return prisma.graphicsConfig.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
      draftJson: JSON.stringify(defaultGraphicsConfig),
      publishedJson: JSON.stringify(defaultGraphicsConfig),
      revisions: {
        create: {
          version: 1,
          configJson: JSON.stringify(defaultGraphicsConfig),
        },
      },
    },
    update: {},
  });
}

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const record = await ensureConfig();
    return NextResponse.json({
      draft: parseGraphicsConfig(record.draftJson),
      published: parseGraphicsConfig(record.publishedJson),
      version: record.version,
      revisions: await prisma.graphicsRevision.findMany({
        where: { configId: record.id },
        orderBy: { version: "desc" },
        take: 20,
        select: { id: true, version: true, createdAt: true },
      }),
    });
  } catch (error) {
    console.error("Graphics configuration load error:", error);
    return NextResponse.json({ error: "Failed to load graphics configuration" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = graphicsConfigSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid graphics configuration", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const config = await ensureConfig();
    await prisma.graphicsConfig.update({
      where: { id: "primary" },
      data: { draftJson: JSON.stringify(parsed.data) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "GRAPHICS_DRAFT_UPDATED",
        entityType: "GraphicsConfig",
        entityId: "primary",
        details: JSON.stringify({ version: config.version }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Graphics configuration save error:", error);
    return NextResponse.json({ error: "Failed to save graphics draft" }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const current = await ensureConfig();
    const draft = graphicsConfigSchema.parse(JSON.parse(current.draftJson));
    const nextVersion = current.version + 1;
    const published = await prisma.$transaction(async (tx) => {
      const updated = await tx.graphicsConfig.update({
        where: { id: "primary" },
        data: {
          publishedJson: JSON.stringify(draft),
          version: nextVersion,
        },
      });
      await tx.graphicsRevision.create({
        data: {
          configId: current.id,
          version: nextVersion,
          configJson: JSON.stringify(draft),
        },
      });
      return updated;
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "GRAPHICS_CONFIG_PUBLISHED",
        entityType: "GraphicsConfig",
        entityId: "primary",
        details: JSON.stringify({ version: published.version }),
      },
    });
    return NextResponse.json({ success: true, version: published.version });
  } catch (error) {
    console.error("Graphics configuration publish error:", error);
    return NextResponse.json({ error: "Failed to publish graphics configuration" }, { status: 500 });
  }
}
