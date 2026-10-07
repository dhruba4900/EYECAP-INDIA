import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const glasses = await prisma.glassOption.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ glasses });
  } catch (error) {
    console.error("Glass GET:", error);
    return NextResponse.json({ error: "Failed to load glass options." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Glass name is required." }, { status: 400 });

    const glass = await prisma.glassOption.create({
      data: {
        name,
        slug: slugify(name),
        description: body.description ? String(body.description) : null,
        material: body.material ? String(body.material) : null,
        priceAdjustment: Number(body.priceAdjustment || 0),
        isActive: body.isActive !== false,
        displayOrder: Number(body.displayOrder || 0),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "GLASS_OPTION_CREATED",
        entityType: "GlassOption",
        entityId: glass.id,
        details: JSON.stringify({ name: glass.name }),
      },
    }).catch(() => {});

    return NextResponse.json({ glass }, { status: 201 });
  } catch (error: any) {
    console.error("Glass POST:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "A glass with that name/slug already exists." }, { status: 409 });
    return NextResponse.json({ error: "Failed to create glass option." }, { status: 500 });
  }
}
