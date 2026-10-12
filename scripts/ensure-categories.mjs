import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUILT_IN_CATEGORIES = [
  {
    name: "EYEGLASSES",
    slug: "eyeglasses",
    description: "Precision engineered luxury eyeglasses with bespoke optical clarity.",
    displayOrder: 1,
    isActive: true,
    showInNavigation: true,
  },
  {
    name: "SUNGLASSES",
    slug: "sunglasses",
    description: "Architectural sunglasses featuring Zeiss UV400 polarized optics.",
    displayOrder: 2,
    isActive: true,
    showInNavigation: true,
  },
  {
    name: "CONTACT LENSES",
    slug: "contact-lenses",
    description: "Hydra-comfort micro-engineered breathable contact lenses.",
    displayOrder: 3,
    isActive: true,
    showInNavigation: true,
  },
  {
    name: "SPECIAL POWER",
    slug: "special-power",
    description: "High-index tailored prescription solutions for complex optical needs.",
    displayOrder: 4,
    isActive: true,
    showInNavigation: true,
  },
  {
    name: "SPECIAL EDITIONS",
    slug: "special-editions",
    description: "Exclusive limited-run titanium crafted architectural masterpieces.",
    displayOrder: 5,
    isActive: true,
    showInNavigation: true,
  },
];

async function main() {
  console.log("Checking and ensuring default built-in categories...");
  for (const cat of BUILT_IN_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: cat.name }, { slug: cat.slug }],
      },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: cat,
      });
      console.log(`Created built-in category: ${created.name} (${created.slug})`);
    } else {
      console.log(`Built-in category already exists: ${existing.name} (${existing.slug})`);
    }
  }

  const all = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
  });
  console.log(`Total categories in database: ${all.length}`);
}

main()
  .catch((e) => {
    console.error("Failed to ensure categories:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
