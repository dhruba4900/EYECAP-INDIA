import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const postSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().max(300).nullable().optional(),
  description: z.string().trim().min(1).max(20000),
  coverImage: z.string().max(2048).refine((value) => /^https?:\/\//i.test(value)).nullable().optional(),
  type: z.enum(["PRODUCT", "ANNOUNCEMENT", "PROMOTION", "ARTICLE", "COLLECTION"]),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  animation: z.enum(["none", "fade", "slide", "scale", "rotate", "carousel"]),
  isFeatured: z.boolean(),
  priority: z.number().int().min(0).max(100),
  publishedAt: z.string().datetime().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
}).superRefine((post, context) => {
  if (post.status === "SCHEDULED" && !post.publishedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["publishedAt"], message: "A publish date is required for scheduled posts" });
  }
  if (post.startsAt && post.endsAt && new Date(post.startsAt) >= new Date(post.endsAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "End date must be after start date" });
  }
});

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const posts = await prisma.post.findMany({ orderBy: [{ updatedAt: "desc" }] });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Admin posts load error:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid post details", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${slugBase || "post"}-${Date.now().toString(36)}`;
    const post = await prisma.post.create({
      data: {
        ...data,
        slug,
        subtitle: data.subtitle || null,
        coverImage: data.coverImage || null,
        publishedAt: toDate(data.publishedAt) || (data.status === "PUBLISHED" ? new Date() : null),
        startsAt: toDate(data.startsAt),
        endsAt: toDate(data.endsAt),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: data.status === "PUBLISHED" ? "POST_PUBLISHED" : "POST_CREATED",
        entityType: "Post",
        entityId: post.id,
        details: JSON.stringify({ title: post.title }),
      },
    });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Admin post creation error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
