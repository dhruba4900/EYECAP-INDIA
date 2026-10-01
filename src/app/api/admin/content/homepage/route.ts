import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const safeUrlSchema = z.string().max(2048).refine(
  (value) => value.startsWith("/") && !value.startsWith("//") || /^https?:\/\//i.test(value),
  "Use a same-site path or an HTTP(S) URL"
);
const nullableUrlSchema = safeUrlSchema.nullable();

const sectionSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/).max(60),
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().max(300).nullable(),
  body: z.string().max(5000).nullable(),
  imageUrl: nullableUrlSchema,
  ctaText: z.string().max(80).nullable(),
  ctaUrl: nullableUrlSchema,
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  animation: z.enum(["none", "fade", "slide", "scale", "rotate"]),
  isEnabled: z.boolean(),
  displayOrder: z.number().int().min(0).max(1000),
});

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  defaultTitle: z.string().trim().min(1).max(160),
  titleTemplate: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  logoUrl: nullableUrlSchema,
  faviconUrl: nullableUrlSchema,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const defaults = [
  {
    key: "hero",
    title: "SEE THE WORLD DIFFERENTLY.",
    subtitle: "Series 2026 • Japanese Beta-Titanium",
    body: "Engineered for vision. Designed for you. Handcrafted in Sabae from aerospace-grade beta-titanium and fitted with Zeiss high-definition optical lenses.",
    ctaText: "Shop Collection",
    ctaUrl: "/products",
    animation: "fade",
    displayOrder: 0,
  },
  {
    key: "categories",
    title: "Explore the EYECAP collections",
    subtitle: "Precision, material and vision—engineered for every point of view.",
    body: null,
    ctaText: null,
    ctaUrl: null,
    animation: "none",
    displayOrder: 1,
  },
  {
    key: "featured",
    title: "Featured Eyewear",
    subtitle: "High-precision frames selected by our team.",
    body: null,
    ctaText: "Explore Complete Catalog",
    ctaUrl: "/products",
    animation: "none",
    displayOrder: 2,
  },
  {
    key: "latest",
    title: "What’s New",
    subtitle: "The latest launches, ideas, and announcements from EYECAP.",
    body: null,
    ctaText: null,
    ctaUrl: null,
    animation: "fade",
    displayOrder: 3,
  },
  {
    key: "craftsmanship",
    title: "Forged at 1,668°C. Finished by Master Artisans.",
    subtitle: "Japanese Beta-Titanium",
    body: "In Fukui Prefecture, Japan, optical metallurgists have refined the craft of titanium cold-forging for over 100 years.",
    ctaText: null,
    ctaUrl: null,
    animation: "none",
    displayOrder: 4,
  },
];

async function ensureContent() {
  await prisma.siteSettings.upsert({
    where: { id: "primary" },
    create: { id: "primary" },
    update: {},
  });
  await Promise.all(
    defaults.map((section) =>
      prisma.homepageSection.upsert({
        where: { key: section.key },
        create: section,
        update: {},
      })
    )
  );
}

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await ensureContent();
    const [settings, sections] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "primary" } }),
      prisma.homepageSection.findMany({ orderBy: { displayOrder: "asc" } }),
    ]);
    return NextResponse.json({ settings, sections });
  } catch (error) {
    console.error("Admin homepage content load error:", error);
    return NextResponse.json({ error: "Failed to load homepage content" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const parsed = z.object({
      settings: settingsSchema,
      sections: z.array(sectionSchema).max(30),
    }).safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid homepage content", details: parsed.error.flatten() }, { status: 400 });
    }

    const keys = parsed.data.sections.map(({ key }) => key);
    if (new Set(keys).size !== keys.length) {
      return NextResponse.json({ error: "Homepage section keys must be unique" }, { status: 400 });
    }

    const { settings, sections } = parsed.data;
    await prisma.$transaction([
      prisma.siteSettings.upsert({
        where: { id: "primary" },
        create: { id: "primary", ...settings },
        update: settings,
      }),
      ...sections.map(({ key, ...data }) =>
        prisma.homepageSection.upsert({
          where: { key },
          create: { key, ...data },
          update: data,
        })
      ),
    ]);

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "HOMEPAGE_CONTENT_UPDATED",
        entityType: "Homepage",
        details: JSON.stringify({ sections: sections.length }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin homepage content update error:", error);
    return NextResponse.json({ error: "Failed to save homepage content" }, { status: 500 });
  }
}
