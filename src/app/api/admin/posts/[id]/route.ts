import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const editSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().max(300).nullable(),
  description: z.string().trim().min(1).max(20000),
  coverImage: z.string().nullable().refine((value) => value === null || /^https?:\/\//i.test(value)),
  type: z.enum(["PRODUCT", "ANNOUNCEMENT", "PROMOTION", "ARTICLE", "COLLECTION"]),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  animation: z.enum(["none", "fade", "slide", "scale", "rotate", "carousel"]),
  isFeatured: z.boolean(),
  priority: z.number().int().min(0).max(100),
  publishedAt: z.string().datetime().nullable(),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
}).superRefine((post, context) => {
  if (post.status === "SCHEDULED" && !post.publishedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["publishedAt"], message: "A publish date is required for scheduled posts" });
  }
  if (post.startsAt && post.endsAt && new Date(post.startsAt) >= new Date(post.endsAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "End date must be after start date" });
  }
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const parsed = editSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid post details", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...data,
        publishedAt: data.status === "PUBLISHED" && !data.publishedAt
          ? new Date()
          : data.publishedAt ? new Date(data.publishedAt) : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: data.status === "PUBLISHED" ? "POST_PUBLISHED" : "POST_UPDATED",
        entityType: "Post",
        entityId: post.id,
        details: JSON.stringify({ title: post.title, status: post.status }),
      },
    });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Admin post status update error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "POST_ARCHIVED",
        entityType: "Post",
        entityId: post.id,
        details: JSON.stringify({ title: post.title }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin post archive error:", error);
    return NextResponse.json({ error: "Failed to archive post" }, { status: 500 });
  }
}
