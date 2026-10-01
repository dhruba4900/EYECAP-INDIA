import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { graphicsConfigSchema } from "@/lib/graphics";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const revision = await prisma.graphicsRevision.findUnique({ where: { id: params.id } });
    if (!revision) return NextResponse.json({ error: "Graphics revision not found" }, { status: 404 });
    const config = graphicsConfigSchema.parse(JSON.parse(revision.configJson));
    await prisma.graphicsConfig.update({
      where: { id: revision.configId },
      data: { draftJson: JSON.stringify(config) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "GRAPHICS_REVISION_RESTORED",
        entityType: "GraphicsConfig",
        entityId: revision.configId,
        details: JSON.stringify({ restoredVersion: revision.version }),
      },
    });
    return NextResponse.json({ success: true, restoredVersion: revision.version });
  } catch (error) {
    console.error("Graphics revision restore error:", error);
    return NextResponse.json({ error: "Failed to restore graphics revision" }, { status: 500 });
  }
}
