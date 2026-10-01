import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting EYECAP comprehensive database seeding...");

  // Clear existing data in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productModelAsset.deleteMany();
  await prisma.productModel3D.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Previous data cleared.");

  // 1. CREATE USERS
  const salt = await bcrypt.genSalt(10);
  const passwords = {
    admin: process.env.ADMIN_PASSWORD,
    courier: process.env.DELIVERY_PASSWORD,
    customer: process.env.CUSTOMER_PASSWORD,
  };
  for (const [role, password] of Object.entries(passwords)) {
    if (!password || password.length < 12) {
      throw new Error(`${role.toUpperCase()}_PASSWORD must be configured and at least 12 characters.`);
    }
  }
  const adminPasswordHash = await bcrypt.hash(passwords.admin, salt);
  const courierPasswordHash = await bcrypt.hash(passwords.courier, salt);
  const customerPasswordHash = await bcrypt.hash(passwords.customer, salt);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@eyecap.luxury",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      firstName: "Marcus",
      lastName: "Vance",
      phone: "+1 (800) 555-0199",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      adminProfile: {
        create: {
          department: "Executive Operations",
          isSuperAdmin: true,
          accessLevel: 10,
        },
      },
    },
  });

  // Delivery Partner User
  const courierUser = await prisma.user.create({
    data: {
      email: "courier@eyecap.luxury",
      passwordHash: courierPasswordHash,
      role: "DELIVERY_PARTNER",
      firstName: "Alex",
      lastName: "Vance",
      phone: "+1 (555) 019-2834",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      deliveryPartner: {
        create: {
          vehicleType: "Zero EV Motorcycle",
          vehiclePlate: "EYE-2026-X",
          currentZone: "Metro Central & Financial District",
          rating: 4.95,
          totalDeliveries: 168,
        },
      },
    },
  });

  const deliveryPartnerProfile = await prisma.deliveryPartner.findUnique({
    where: { userId: courierUser.id },
  });

  // Customer User
  const customerUser = await prisma.user.create({
    data: {
      email: "dhiman@eyecap.luxury",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      firstName: "Dhiman",
      lastName: "Roy",
      phone: "+1 (555) 392-8810",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      customerProfile: {
        create: {
          loyaltyPoints: 350,
          prescriptionType: "BlueLight Filter + Single Vision",
          odSphere: -1.25,
          osSphere: -1.00,
          pupillaryDistance: 63.5,
        },
      },
    },
  });

  // Customer Address
  const customerAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      fullName: "Dhiman Roy",
      phone: "+1 (555) 392-8810",
      street: "742 Evergreen Terrace, Suite 4B",
      apartment: "Penthouse Level",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "United States",
      isDefault: true,
      type: "HOME",
    },
  });

  console.log("👤 Users seeded: Admin, Delivery Partner, Customer");

  // 2. CREATE CATEGORIES
  const categoriesData = [
    {
      name: "Titanium Luxury",
      slug: "titanium-luxury",
      description: "Forged from aerospace-grade Japanese beta-titanium. Ultra-lightweight precision under 16 grams.",
      bannerImage: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 1,
    },
    {
      name: "Sun & Polarized",
      slug: "sun-polarized",
      description: "Zeiss optical polarized lenses with 100% UV400 shield and anti-reflective hydro-oleophobic coating.",
      bannerImage: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 2,
    },
    {
      name: "BlueBlock Digital",
      slug: "blueblock-digital",
      description: "Engineered for engineers, designers, and screen specialists. High-transmission 450nm harmonic filtering.",
      bannerImage: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 3,
    },
    {
      name: "CyberTech Smart Audio",
      slug: "cybertech-smart-audio",
      description: "Micro open-ear directional beamforming drivers with Bluetooth 5.4 and touch-gesture temple control.",
      bannerImage: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 4,
    },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log("🏷️ Categories seeded: 4 core categories");

  // 3. CREATE 24 PREMIUM PRODUCTS WITH VARIANTS, 3D MODELS & INVENTORY
  const productsSeed = [
    // --- Category: Titanium Luxury ---
    {
      name: "EYECAP Chronos Alpha",
      slug: "eyecap-chronos-alpha",
      headline: "The pinnacle of architectural titanium minimalism",
      description: "Crafted in Sabae, Japan. Featuring laser-cut Japanese Beta-Titanium rims with an aerodynamic floating double bridge. Weighing a mere 14.8 grams, Chronos Alpha disappears on your face while commanding every room.",
      basePrice: 385,
      comparePrice: 450,
      sku: "EYE-CHR-001",
      categorySlug: "titanium-luxury",
      isFeatured: true,
      isNew: true,
      frameShape: "Geometric",
      frameMaterial: "Grade 5 Beta-Titanium",
      lensMaterial: "Zeiss High-Index Polyamide",
      lensWidthMm: 52,
      bridgeWidthMm: 19,
      templeLengthMm: 145,
      totalWeightG: 15,
      modelType: "geometric",
      lensColor: "#0F172A",
      frameColor: "#22252A",
      metalness: 0.95,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Matte Stealth Black", colorName: "Stealth Black", colorHex: "#181A20", size: "Medium (52mm)", sku: "EYE-CHR-001-BLK", priceAdjustment: 0 },
        { name: "Brushed Platinum Silver", colorName: "Platinum Silver", colorHex: "#D1D5DB", size: "Medium (52mm)", sku: "EYE-CHR-001-SLV", priceAdjustment: 20 },
        { name: "24K Champagne Gold", colorName: "Champagne Gold", colorHex: "#D4AF37", size: "Medium (52mm)", sku: "EYE-CHR-001-GLD", priceAdjustment: 40 },
      ],
      stock: 45,
    },
    {
      name: "EYECAP Aerolite Pro",
      slug: "eyecap-aerolite-pro",
      headline: "Zero-screw compression hinge engineering",
      description: "Aerolite Pro eliminates traditional hinge screws with a patented micro-friction flex cylinder. Precision milled from a single sheet of titanium alloy with zero solder points.",
      basePrice: 420,
      comparePrice: 490,
      sku: "EYE-AER-002",
      categorySlug: "titanium-luxury",
      isFeatured: true,
      isNew: false,
      frameShape: "Rectangular",
      frameMaterial: "Pure Japanese Titanium",
      lensMaterial: "Essilor Crizal Anti-Reflective",
      lensWidthMm: 54,
      bridgeWidthMm: 17,
      templeLengthMm: 142,
      totalWeightG: 13,
      modelType: "rectangular",
      lensColor: "#1E293B",
      frameColor: "#4B5563",
      metalness: 0.90,
      roughness: 0.20,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Carbon Gunmetal", colorName: "Gunmetal", colorHex: "#374151", size: "Standard (54mm)", sku: "EYE-AER-002-GNM", priceAdjustment: 0 },
        { name: "Raw Matte Titanium", colorName: "Raw Titanium", colorHex: "#9CA3AF", size: "Standard (54mm)", sku: "EYE-AER-002-RAW", priceAdjustment: 15 },
      ],
      stock: 32,
    },
    {
      name: "EYECAP Apex Minimalist",
      slug: "eyecap-apex-minimalist",
      headline: "The featherweight rimless silhouette",
      description: "Designed for discerning purists. The Apex Minimalist mounts high-precision ultra-clear lenses directly to custom sculpted titanium temples.",
      basePrice: 340,
      comparePrice: null,
      sku: "EYE-APX-003",
      categorySlug: "titanium-luxury",
      isFeatured: false,
      isNew: true,
      frameShape: "Round",
      frameMaterial: "Beta-Titanium Wire",
      lensMaterial: "Ultra-Tough Trivex Polarized",
      lensWidthMm: 50,
      bridgeWidthMm: 20,
      templeLengthMm: 148,
      totalWeightG: 11,
      modelType: "geometric",
      lensColor: "#334155",
      frameColor: "#D4AF37",
      metalness: 0.98,
      roughness: 0.12,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Satin Gold", colorName: "Satin Gold", colorHex: "#E5C07B", size: "Compact (50mm)", sku: "EYE-APX-003-GLD", priceAdjustment: 0 },
        { name: "Mirror Chrome", colorName: "Mirror Chrome", colorHex: "#E5E7EB", size: "Compact (50mm)", sku: "EYE-APX-003-CHR", priceAdjustment: 10 },
      ],
      stock: 28,
    },
    {
      name: "EYECAP Obsidian Octa",
      slug: "eyecap-obsidian-octa",
      headline: "Eight-sided faceted geometric luxury",
      description: "Bold octagonal contours with beveled chassis edges that capture ambient reflections with striking sophistication.",
      basePrice: 395,
      comparePrice: 460,
      sku: "EYE-OBS-004",
      categorySlug: "titanium-luxury",
      isFeatured: true,
      isNew: false,
      frameShape: "Geometric",
      frameMaterial: "Grade 5 Titanium + Black PVD",
      lensMaterial: "Zeiss Hydrophobic Tint",
      lensWidthMm: 51,
      bridgeWidthMm: 21,
      templeLengthMm: 145,
      totalWeightG: 16,
      modelType: "geometric",
      lensColor: "#020617",
      frameColor: "#111827",
      metalness: 0.92,
      roughness: 0.18,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Obsidian PVD", colorName: "Obsidian Black", colorHex: "#0F172A", size: "Standard (51mm)", sku: "EYE-OBS-004-PVD", priceAdjustment: 0 },
      ],
      stock: 18,
    },
    {
      name: "EYECAP Quantum Monolith",
      slug: "eyecap-quantum-monolith",
      headline: "Seamless monoblock front construction",
      description: "Carved from a continuous 4mm block of dense titanium alloy, with no welds or seams. Uncompromising rigidity meets absolute fluid elegance.",
      basePrice: 475,
      comparePrice: 550,
      sku: "EYE-QNT-005",
      categorySlug: "titanium-luxury",
      isFeatured: false,
      isNew: true,
      frameShape: "Aviator",
      frameMaterial: "Monoblock Titanium",
      lensMaterial: "Diamond-Coat Polycarbonate",
      lensWidthMm: 56,
      bridgeWidthMm: 16,
      templeLengthMm: 145,
      totalWeightG: 19,
      modelType: "aviator",
      lensColor: "#1E293B",
      frameColor: "#475569",
      metalness: 0.95,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Brushed Graphite", colorName: "Graphite", colorHex: "#334155", size: "Large (56mm)", sku: "EYE-QNT-005-GRP", priceAdjustment: 0 },
      ],
      stock: 15,
    },
    {
      name: "EYECAP Helios Sovereign",
      slug: "eyecap-helios-sovereign",
      headline: "Warm 18K rose titanium with polarized bronze optics",
      description: "Designed for sunset drives and alpine light. Combining warmth of rose titanium with bronze polarized contrast-enhancing glass.",
      basePrice: 440,
      comparePrice: 510,
      sku: "EYE-HEL-006",
      categorySlug: "titanium-luxury",
      isFeatured: false,
      isNew: false,
      frameShape: "Round",
      frameMaterial: "Rose Gold Titanium Alloy",
      lensMaterial: "Bronze Polarized UV400",
      lensWidthMm: 49,
      bridgeWidthMm: 21,
      templeLengthMm: 145,
      totalWeightG: 14,
      modelType: "geometric",
      lensColor: "#78350F",
      frameColor: "#B45309",
      metalness: 0.90,
      roughness: 0.22,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Rose Bronze", colorName: "Rose Gold", colorHex: "#B45309", size: "Compact (49mm)", sku: "EYE-HEL-006-RSB", priceAdjustment: 0 },
      ],
      stock: 22,
    },

    // --- Category: Sun & Polarized ---
    {
      name: "EYECAP Horizon Aviator",
      slug: "eyecap-horizon-aviator",
      headline: "The supersonic teardrop icon re-engineered",
      description: "The timeless pilot silhouette rebuilt for the future with aerodynamic titanium brow-bar and high-definition gradient polarized optical lenses.",
      basePrice: 295,
      comparePrice: 350,
      sku: "EYE-HRZ-007",
      categorySlug: "sun-polarized",
      isFeatured: true,
      isNew: false,
      frameShape: "Aviator",
      frameMaterial: "Surgical Stainless Steel & Titanium",
      lensMaterial: "Polarized HD PolarVision UV400",
      lensWidthMm: 58,
      bridgeWidthMm: 14,
      templeLengthMm: 140,
      totalWeightG: 21,
      modelType: "aviator",
      lensColor: "#064E3B",
      frameColor: "#D4AF37",
      metalness: 0.92,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Gold / Deep Emerald Lens", colorName: "Gold / Emerald", colorHex: "#D4AF37", size: "Classic (58mm)", sku: "EYE-HRZ-007-GLD", priceAdjustment: 0 },
        { name: "Stealth Black / Smoke Polar", colorName: "Matte Black", colorHex: "#111827", size: "Classic (58mm)", sku: "EYE-HRZ-007-BLK", priceAdjustment: 10 },
      ],
      stock: 65,
    },
    {
      name: "EYECAP Mirage Polarized",
      slug: "eyecap-mirage-polarized",
      headline: "Wide-aspect panoramic sun shield",
      description: "Engineered for glare-free peripheral vision along coastal drives and aquatic sport. Features oleophobic scratch-resistant nanocoating.",
      basePrice: 320,
      comparePrice: 380,
      sku: "EYE-MIR-008",
      categorySlug: "sun-polarized",
      isFeatured: true,
      isNew: true,
      frameShape: "Geometric",
      frameMaterial: "Italian Mazzucchelli Bio-Acetate",
      lensMaterial: "Bio-Nylon Polarized Glass",
      lensWidthMm: 55,
      bridgeWidthMm: 18,
      templeLengthMm: 145,
      totalWeightG: 26,
      modelType: "geometric",
      lensColor: "#172554",
      frameColor: "#1E293B",
      metalness: 0.40,
      roughness: 0.10,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Deep Navy Crystal", colorName: "Navy Crystal", colorHex: "#1E3A8A", size: "Standard (55mm)", sku: "EYE-MIR-008-NAV", priceAdjustment: 0 },
        { name: "Smoky Tortoise", colorName: "Dark Tortoise", colorHex: "#451A03", size: "Standard (55mm)", sku: "EYE-MIR-008-TRT", priceAdjustment: 20 },
      ],
      stock: 40,
    },
    {
      name: "EYECAP Solarium Wayfarer",
      slug: "eyecap-solarium-wayfarer",
      headline: "The modern architectural reimagining of the classic",
      description: "Thick hand-beveled acetate edges with custom diamond-cross core wire visible through semi-translucent Italian cellulose.",
      basePrice: 280,
      comparePrice: null,
      sku: "EYE-SOL-009",
      categorySlug: "sun-polarized",
      isFeatured: false,
      isNew: false,
      frameShape: "Rectangular",
      frameMaterial: "Mazzucchelli Acetate",
      lensMaterial: "Mineral Polarized Crystal",
      lensWidthMm: 53,
      bridgeWidthMm: 20,
      templeLengthMm: 150,
      totalWeightG: 28,
      modelType: "rectangular",
      lensColor: "#0F172A",
      frameColor: "#020617",
      metalness: 0.20,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Gloss Onyx", colorName: "Gloss Onyx", colorHex: "#000000", size: "Standard (53mm)", sku: "EYE-SOL-009-ONX", priceAdjustment: 0 },
      ],
      stock: 55,
    },
    {
      name: "EYECAP Eclipse Noir",
      slug: "eyecap-eclipse-noir",
      headline: "Total blacked-out luxury with Category 4 density",
      description: "Deep dark polarized lenses designed for extreme sunlight, high-altitude glaciers, and midday desert glare.",
      basePrice: 310,
      comparePrice: 360,
      sku: "EYE-ECL-010",
      categorySlug: "sun-polarized",
      isFeatured: false,
      isNew: true,
      frameShape: "Geometric",
      frameMaterial: "Matte Blackened Steel",
      lensMaterial: "Category 4 High-Density Polarized",
      lensWidthMm: 52,
      bridgeWidthMm: 19,
      templeLengthMm: 145,
      totalWeightG: 22,
      modelType: "geometric",
      lensColor: "#000000",
      frameColor: "#0F172A",
      metalness: 0.85,
      roughness: 0.30,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Matte Jet Black", colorName: "Jet Black", colorHex: "#111827", size: "Standard (52mm)", sku: "EYE-ECL-010-JET", priceAdjustment: 0 },
      ],
      stock: 30,
    },
    {
      name: "EYECAP Spectra Gradient",
      slug: "eyecap-spectra-gradient",
      headline: "Dual-tone twilight gradient glass",
      description: "Transitions seamlessly from deep midnight purple at the brow to warm champagne at the cheekbones for optimal reading and dashboard clarity.",
      basePrice: 335,
      comparePrice: 390,
      sku: "EYE-SPC-011",
      categorySlug: "sun-polarized",
      isFeatured: false,
      isNew: false,
      frameShape: "Aviator",
      frameMaterial: "Palladium Finished Titanium",
      lensMaterial: "Custom Spectra Gradient Glass",
      lensWidthMm: 57,
      bridgeWidthMm: 15,
      templeLengthMm: 145,
      totalWeightG: 18,
      modelType: "aviator",
      lensColor: "#4C1D95",
      frameColor: "#E2E8F0",
      metalness: 0.95,
      roughness: 0.10,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Silver / Twilight Gradient", colorName: "Silver Gradient", colorHex: "#E2E8F0", size: "Large (57mm)", sku: "EYE-SPC-011-SLV", priceAdjustment: 0 },
      ],
      stock: 25,
    },
    {
      name: "EYECAP Veloce Carbon",
      slug: "eyecap-veloce-carbon",
      headline: "Hand-laid 3K twill carbon fiber temples",
      description: "Inspired by GT motorsport. Ultra-torsional stiffness with rubberized interior ear grips that lock comfortably even at high G-forces.",
      basePrice: 360,
      comparePrice: 420,
      sku: "EYE-VEL-012",
      categorySlug: "sun-polarized",
      isFeatured: false,
      isNew: true,
      frameShape: "Rectangular",
      frameMaterial: "3K Forged Carbon + Titanium",
      lensMaterial: "Mirror Blue Polycarbonate Polarized",
      lensWidthMm: 56,
      bridgeWidthMm: 16,
      templeLengthMm: 142,
      totalWeightG: 17,
      modelType: "rectangular",
      lensColor: "#0284C7",
      frameColor: "#18181B",
      metalness: 0.70,
      roughness: 0.35,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Matte Carbon / Blue Mirror", colorName: "Matte Carbon", colorHex: "#27272A", size: "Sport (56mm)", sku: "EYE-VEL-012-CRB", priceAdjustment: 0 },
      ],
      stock: 20,
    },

    // --- Category: BlueBlock Digital ---
    {
      name: "EYECAP Lumina Clear",
      slug: "eyecap-lumina-clear",
      headline: "Zero-tint crystal clear blue light protection",
      description: "Unlike yellow-tinted gaming glasses, Lumina Clear delivers 99.2% optical luminous transmission while eliminating digital eye strain across 12-hour coding sprints.",
      basePrice: 245,
      comparePrice: 290,
      sku: "EYE-LUM-013",
      categorySlug: "blueblock-digital",
      isFeatured: true,
      isNew: false,
      frameShape: "Round",
      frameMaterial: "Swedish Polyamide + Titanium",
      lensMaterial: "LuminaGuard BlueBlock Nano-Matrix",
      lensWidthMm: 50,
      bridgeWidthMm: 19,
      templeLengthMm: 145,
      totalWeightG: 14,
      modelType: "geometric",
      lensColor: "#F8FAFC",
      frameColor: "#334155",
      metalness: 0.60,
      roughness: 0.20,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Clear Crystal Gray", colorName: "Crystal Gray", colorHex: "#64748B", size: "Universal (50mm)", sku: "EYE-LUM-013-GRY", priceAdjustment: 0 },
        { name: "Frosted Transparent", colorName: "Frosted Clear", colorHex: "#CBD5E1", size: "Universal (50mm)", sku: "EYE-LUM-013-CLR", priceAdjustment: 10 },
      ],
      stock: 80,
    },
    {
      name: "EYECAP CyberShield Neo",
      slug: "eyecap-cybershield-neo",
      headline: "Ergonomically tuned for dual-monitor workflows",
      description: "Engineered specifically to alleviate neck tension and eye fatigue with expansive vertical aperture and blue-violet 415-455nm light suppression.",
      basePrice: 260,
      comparePrice: 310,
      sku: "EYE-CSH-014",
      categorySlug: "blueblock-digital",
      isFeatured: true,
      isNew: true,
      frameShape: "Rectangular",
      frameMaterial: "Flexible Memory Metal",
      lensMaterial: "High-Def BlueShield Anti-Glare",
      lensWidthMm: 53,
      bridgeWidthMm: 17,
      templeLengthMm: 140,
      totalWeightG: 15,
      modelType: "rectangular",
      lensColor: "#F1F5F9",
      frameColor: "#1E293B",
      metalness: 0.80,
      roughness: 0.25,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Midnight Gunmetal", colorName: "Gunmetal", colorHex: "#334155", size: "Standard (53mm)", sku: "EYE-CSH-014-GNM", priceAdjustment: 0 },
      ],
      stock: 50,
    },
    {
      name: "EYECAP Cortex Hex",
      slug: "eyecap-cortex-hex",
      headline: "Hexagonal geometry for creative visionaries",
      description: "A subtle 6-sided rim profile that flatters oval and round facial contours while providing sharp, fatigue-free text rendering.",
      basePrice: 275,
      comparePrice: null,
      sku: "EYE-CTX-015",
      categorySlug: "blueblock-digital",
      isFeatured: false,
      isNew: false,
      frameShape: "Geometric",
      frameMaterial: "Sleek Wire Titanium",
      lensMaterial: "Optical Resin BlueFilter 450",
      lensWidthMm: 51,
      bridgeWidthMm: 20,
      templeLengthMm: 146,
      totalWeightG: 13,
      modelType: "geometric",
      lensColor: "#F8FAFC",
      frameColor: "#64748B",
      metalness: 0.90,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Polished Steel", colorName: "Steel", colorHex: "#94A3B8", size: "Medium (51mm)", sku: "EYE-CTX-015-STL", priceAdjustment: 0 },
      ],
      stock: 35,
    },
    {
      name: "EYECAP Prism Minimal",
      slug: "eyecap-prism-minimal",
      headline: "Barely-there comfort for marathon productivity",
      description: "Weighing only 12 grams with hypoallergenic silicone air-cushion nose pads that leave zero red marks even after 14 hours.",
      basePrice: 230,
      comparePrice: 270,
      sku: "EYE-PRS-016",
      categorySlug: "blueblock-digital",
      isFeatured: false,
      isNew: false,
      frameShape: "Round",
      frameMaterial: "Micro Titanium Filament",
      lensMaterial: "Digital EyeShield UV420",
      lensWidthMm: 48,
      bridgeWidthMm: 21,
      templeLengthMm: 145,
      totalWeightG: 12,
      modelType: "geometric",
      lensColor: "#F1F5F9",
      frameColor: "#D4AF37",
      metalness: 0.92,
      roughness: 0.18,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Pale Champagne", colorName: "Champagne", colorHex: "#FDE68A", size: "Petite (48mm)", sku: "EYE-PRS-016-CHP", priceAdjustment: 0 },
      ],
      stock: 42,
    },
    {
      name: "EYECAP FilterZero Round",
      slug: "eyecap-filterzero-round",
      headline: "Academic retro round with digital edge",
      description: "Classic intellectual circle geometry upgraded with multi-layer green anti-reflective vacuum coating to stop back-glare.",
      basePrice: 250,
      comparePrice: 295,
      sku: "EYE-FZR-017",
      categorySlug: "blueblock-digital",
      isFeatured: false,
      isNew: true,
      frameShape: "Round",
      frameMaterial: "Acetate Rims + Titanium Bridge",
      lensMaterial: "Multi-Coat BlueBlock",
      lensWidthMm: 49,
      bridgeWidthMm: 20,
      templeLengthMm: 145,
      totalWeightG: 16,
      modelType: "geometric",
      lensColor: "#F8FAFC",
      frameColor: "#1E293B",
      metalness: 0.40,
      roughness: 0.20,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Tokyo Tortoise / Black", colorName: "Tortoise", colorHex: "#78350F", size: "Classic (49mm)", sku: "EYE-FZR-017-TRT", priceAdjustment: 0 },
      ],
      stock: 29,
    },
    {
      name: "EYECAP VisionCore Studio",
      slug: "eyecap-visioncore-studio",
      headline: "True color calibration for professional artists",
      description: "Delta-E color accuracy < 0.8 with targeted narrow-band blue light absorption, ensuring colorists and graphic designers see accurate hues.",
      basePrice: 290,
      comparePrice: 340,
      sku: "EYE-VCS-018",
      categorySlug: "blueblock-digital",
      isFeatured: false,
      isNew: false,
      frameShape: "Rectangular",
      frameMaterial: "Carbon Infused Polymer",
      lensMaterial: "ColorCal TrueTone Optical Glass",
      lensWidthMm: 54,
      bridgeWidthMm: 18,
      templeLengthMm: 148,
      totalWeightG: 17,
      modelType: "rectangular",
      lensColor: "#FFFFFF",
      frameColor: "#0F172A",
      metalness: 0.30,
      roughness: 0.20,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Matte Blackened Steel", colorName: "Studio Black", colorHex: "#0F172A", size: "Wide (54mm)", sku: "EYE-VCS-018-BLK", priceAdjustment: 0 },
      ],
      stock: 38,
    },

    // --- Category: CyberTech Smart Audio ---
    {
      name: "EYECAP SoundWave Horizon",
      slug: "eyecap-soundwave-horizon",
      headline: "Spatial open-ear acoustic luxury eyewear",
      description: "Direct-to-ear bone & air conduction transducers embedded seamlessly into tapered titanium temples. Crystal clear conference calls and private podcasts with zero ear canal fatigue.",
      basePrice: 480,
      comparePrice: 560,
      sku: "EYE-SWH-019",
      categorySlug: "cybertech-smart-audio",
      isFeatured: true,
      isNew: true,
      frameShape: "Aviator",
      frameMaterial: "Ultrasonic Sealed Titanium + Bio-Polymer",
      lensMaterial: "Photochromic Smart Transition Lenses",
      lensWidthMm: 56,
      bridgeWidthMm: 18,
      templeLengthMm: 152,
      totalWeightG: 34,
      modelType: "smart_audio",
      lensColor: "#0F172A",
      frameColor: "#111827",
      metalness: 0.85,
      roughness: 0.20,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Stealth Black / Photochromic", colorName: "Stealth Black", colorHex: "#111827", size: "Standard (56mm)", sku: "EYE-SWH-019-BLK", priceAdjustment: 0 },
        { name: "Titanium Cyber Frost", colorName: "Cyber Frost", colorHex: "#E2E8F0", size: "Standard (56mm)", sku: "EYE-SWH-019-FRS", priceAdjustment: 30 },
      ],
      stock: 35,
    },
    {
      name: "EYECAP Pulse Acoustic Pro",
      slug: "eyecap-pulse-acoustic-pro",
      headline: "16-hour battery life with touch-sensitive swipe temple",
      description: "Tap to answer calls, double-tap for voice assistant, swipe to adjust volume. Dual beamforming microphones filter out wind noise up to 40 km/h.",
      basePrice: 520,
      comparePrice: 599,
      sku: "EYE-PUL-020",
      categorySlug: "cybertech-smart-audio",
      isFeatured: true,
      isNew: true,
      frameShape: "Geometric",
      frameMaterial: "Acoustically Tuned Magnesium Alloy",
      lensMaterial: "Polarized Smoke UV400",
      lensWidthMm: 53,
      bridgeWidthMm: 19,
      templeLengthMm: 150,
      totalWeightG: 32,
      modelType: "smart_audio",
      lensColor: "#1E293B",
      frameColor: "#334155",
      metalness: 0.90,
      roughness: 0.18,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Deep Gunmetal", colorName: "Gunmetal", colorHex: "#334155", size: "Medium (53mm)", sku: "EYE-PUL-020-GNM", priceAdjustment: 0 },
      ],
      stock: 25,
    },
    {
      name: "EYECAP NeuroLink Audio",
      slug: "eyecap-neurolink-audio",
      headline: "Ultra-compact smart acoustics disguised as optical frames",
      description: "Looks like a classical designer titanium optical frame. Nobody knows you're listening to a private briefing or receiving navigation cues.",
      basePrice: 460,
      comparePrice: 520,
      sku: "EYE-NRX-021",
      categorySlug: "cybertech-smart-audio",
      isFeatured: false,
      isNew: false,
      frameShape: "Rectangular",
      frameMaterial: "Super-Elastic Titanium + Smart Circuitry",
      lensMaterial: "Zeiss Clear BlueBlock 450",
      lensWidthMm: 52,
      bridgeWidthMm: 18,
      templeLengthMm: 148,
      totalWeightG: 29,
      modelType: "smart_audio",
      lensColor: "#F8FAFC",
      frameColor: "#0F172A",
      metalness: 0.88,
      roughness: 0.22,
      images: [
        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Matte Jet Onyx", colorName: "Onyx", colorHex: "#0F172A", size: "Standard (52mm)", sku: "EYE-NRX-021-ONX", priceAdjustment: 0 },
      ],
      stock: 20,
    },
    {
      name: "EYECAP CyberOptic HUD",
      slug: "eyecap-cyberoptic-hud",
      headline: "Micro-OLED heads-up optical companion",
      description: "Monochrome micro-projection waveguide in the peripheral upper corner displays incoming notifications, teleprompting, and turn-by-turn cycling navigation.",
      basePrice: 650,
      comparePrice: 750,
      sku: "EYE-HUD-022",
      categorySlug: "cybertech-smart-audio",
      isFeatured: true,
      isNew: true,
      frameShape: "Geometric",
      frameMaterial: "Additive Manufactured Titanium Matrix",
      lensMaterial: "Waveguide Optical Glass + Polarized",
      lensWidthMm: 55,
      bridgeWidthMm: 17,
      templeLengthMm: 152,
      totalWeightG: 39,
      modelType: "smart_audio",
      lensColor: "#020617",
      frameColor: "#0284C7",
      metalness: 0.95,
      roughness: 0.15,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Cyber Cyan Anodized", colorName: "Cyan Anodized", colorHex: "#0284C7", size: "Standard (55mm)", sku: "EYE-HUD-022-CYN", priceAdjustment: 0 },
      ],
      stock: 12,
    },
    {
      name: "EYECAP Stealth Wave",
      slug: "eyecap-stealth-wave",
      headline: "Waterproof IP67 open-ear running & marine eyewear",
      description: "Tested against saltwater spray and torrential rain. Resilient magnetic charging port and sweat-impervious silicone seals.",
      basePrice: 430,
      comparePrice: 490,
      sku: "EYE-STW-023",
      categorySlug: "cybertech-smart-audio",
      isFeatured: false,
      isNew: false,
      frameShape: "Aviator",
      frameMaterial: "Hydrophobic Polymer + Titanium",
      lensMaterial: "Mirror Gold Polarized Hydrophobic",
      lensWidthMm: 57,
      bridgeWidthMm: 16,
      templeLengthMm: 148,
      totalWeightG: 31,
      modelType: "smart_audio",
      lensColor: "#D97706",
      frameColor: "#18181B",
      metalness: 0.75,
      roughness: 0.30,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Carbon & Solar Gold", colorName: "Solar Gold", colorHex: "#F59E0B", size: "Sport (57mm)", sku: "EYE-STW-023-GLD", priceAdjustment: 0 },
      ],
      stock: 22,
    },
    {
      name: "EYECAP Vanguard Tech",
      slug: "eyecap-vanguard-tech",
      headline: "Executive audio glasses with 3-day standby battery",
      description: "Crafted for global venture executives and high-stakes dealmakers. Seamless Bluetooth multi-point lets you switch between laptop and phone effortlessly.",
      basePrice: 495,
      comparePrice: 580,
      sku: "EYE-VAN-024",
      categorySlug: "cybertech-smart-audio",
      isFeatured: false,
      isNew: true,
      frameShape: "Rectangular",
      frameMaterial: "Brushed Platinum Titanium",
      lensMaterial: "Crizal Sapphire BlueShield",
      lensWidthMm: 53,
      bridgeWidthMm: 18,
      templeLengthMm: 150,
      totalWeightG: 30,
      modelType: "smart_audio",
      lensColor: "#F8FAFC",
      frameColor: "#94A3B8",
      metalness: 0.96,
      roughness: 0.12,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
      ],
      variants: [
        { name: "Platinum Executive", colorName: "Platinum", colorHex: "#E2E8F0", size: "Executive (53mm)", sku: "EYE-VAN-024-PLT", priceAdjustment: 0 },
      ],
      stock: 19,
    },
  ];

  const createdProducts = [];
  for (const item of productsSeed) {
    const category = categories[item.categorySlug];
    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        headline: item.headline,
        description: item.description,
        basePrice: item.basePrice,
        comparePrice: item.comparePrice,
        sku: item.sku,
        categoryId: category.id,
        isFeatured: item.isFeatured,
        isNew: item.isNew,
        frameShape: item.frameShape,
        frameMaterial: item.frameMaterial,
        lensMaterial: item.lensMaterial,
        lensWidthMm: item.lensWidthMm,
        bridgeWidthMm: item.bridgeWidthMm,
        templeLengthMm: item.templeLengthMm,
        totalWeightG: item.totalWeightG,
        rating: 4.8 + Number((Math.random() * 0.2).toFixed(1)),
        reviewCount: Math.floor(12 + Math.random() * 45),
        inventory: {
          create: {
            available: item.stock,
            reserved: 2,
            sold: Math.floor(10 + Math.random() * 50),
            lowStockThreshold: 8,
          },
        },
        model3d: {
          create: {
            posterUrl: item.images[0],
            modelType: item.modelType,
            lensColor: item.lensColor,
            frameColor: item.frameColor,
            metalness: item.metalness,
            roughness: item.roughness,
            transmission: item.modelType === "smart_audio" ? 0.4 : 0.65,
          },
        },
        images: {
          create: item.images.map((url, idx) => ({
            url,
            alt: `${item.name} - View ${idx + 1}`,
            displayOrder: idx,
            isPrimary: idx === 0,
          })),
        },
        variants: {
          create: item.variants.map((v) => ({
            name: v.name,
            colorName: v.colorName,
            colorHex: v.colorHex,
            size: v.size,
            sku: v.sku,
            priceAdjustment: v.priceAdjustment,
            imageUrl: item.images[0],
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    createdProducts.push(product);
  }

  console.log(`👓 Created ${createdProducts.length} full-spec luxury products with 3D configs & inventory.`);

  // 4. CREATE DISCOUNT COUPONS
  const couponsData = [
    {
      code: "EYECAP10",
      description: "10% off your entire inaugural order",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 100,
      usageLimit: 1000,
    },
    {
      code: "VISION2026",
      description: "$50 off premium eyewear orders above $300",
      discountType: "FIXED",
      discountValue: 50,
      minOrderValue: 300,
      usageLimit: 500,
    },
    {
      code: "VIPLUXURY",
      description: "Exclusive 15% VIP discount",
      discountType: "PERCENT",
      discountValue: 15,
      minOrderValue: 250,
      usageLimit: 250,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.create({ data: c });
  }
  console.log("🎟️ Coupons seeded: EYECAP10, VISION2026, VIPLUXURY");

  // 5. CREATE SAMPLE ORDERS CONNECTING FULL WORKFLOW
  // Order 1: OUT_FOR_DELIVERY assigned to delivery partner (Ready for OTP verification test!)
  const sampleProduct1 = createdProducts[0]; // Chronos Alpha
  const sampleVariant1 = sampleProduct1.variants[0];
  const otp1 = "492817";

  const order1 = await prisma.order.create({
    data: {
      orderNumber: "EYE-2026-90412",
      userId: customerUser.id,
      addressId: customerAddress.id,
      status: "OUT_FOR_DELIVERY",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      subtotal: sampleProduct1.basePrice,
      discount: 38.5,
      tax: 28.5,
      shippingFee: 0.0,
      total: sampleProduct1.basePrice - 38.5 + 28.5,
      couponCode: "EYECAP10",
      deliveryOtp: otp1,
      notes: "Please leave at 4th floor reception if call unanswered.",
      items: {
        create: [
          {
            productId: sampleProduct1.id,
            variantId: sampleVariant1.id,
            productName: sampleProduct1.name,
            variantName: sampleVariant1.name,
            colorHex: sampleVariant1.colorHex,
            sku: sampleVariant1.sku,
            unitPrice: sampleProduct1.basePrice,
            quantity: 1,
            totalPrice: sampleProduct1.basePrice,
          },
        ],
      },
      payments: {
        create: {
          transactionId: "TXN_SIM_2026_994812",
          provider: "STRIPE_SIMULATED",
          amount: sampleProduct1.basePrice - 38.5 + 28.5,
          currency: "USD",
          status: "SUCCESS",
        },
      },
      delivery: {
        create: {
          partnerId: deliveryPartnerProfile.id,
          status: "OUT_FOR_DELIVERY",
          customerOtp: otp1,
          assignedAt: new Date(Date.now() - 3600000 * 3),
          acceptedAt: new Date(Date.now() - 3600000 * 2),
          pickedUpAt: new Date(Date.now() - 3600000),
          outForDeliveryAt: new Date(Date.now() - 1800000),
        },
      },
    },
  });

  // Order 2: PROCESSING (Needs delivery partner assignment by Admin)
  const sampleProduct2 = createdProducts[6]; // Horizon Aviator
  const sampleVariant2 = sampleProduct2.variants[0];
  const otp2 = "782194";

  await prisma.order.create({
    data: {
      orderNumber: "EYE-2026-90413",
      userId: customerUser.id,
      addressId: customerAddress.id,
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      subtotal: sampleProduct2.basePrice,
      discount: 0,
      tax: 24.0,
      shippingFee: 0.0,
      total: sampleProduct2.basePrice + 24.0,
      deliveryOtp: otp2,
      items: {
        create: [
          {
            productId: sampleProduct2.id,
            variantId: sampleVariant2.id,
            productName: sampleProduct2.name,
            variantName: sampleVariant2.name,
            colorHex: sampleVariant2.colorHex,
            sku: sampleVariant2.sku,
            unitPrice: sampleProduct2.basePrice,
            quantity: 1,
            totalPrice: sampleProduct2.basePrice,
          },
        ],
      },
      payments: {
        create: {
          transactionId: "TXN_SIM_2026_994813",
          provider: "STRIPE_SIMULATED",
          amount: sampleProduct2.basePrice + 24.0,
          currency: "USD",
          status: "SUCCESS",
        },
      },
      delivery: {
        create: {
          status: "UNASSIGNED",
          customerOtp: otp2,
        },
      },
    },
  });

  // Order 3: DELIVERED (Historical completed order)
  const sampleProduct3 = createdProducts[12]; // Lumina Clear
  const sampleVariant3 = sampleProduct3.variants[0];
  const otp3 = "519283";

  await prisma.order.create({
    data: {
      orderNumber: "EYE-2026-90401",
      userId: customerUser.id,
      addressId: customerAddress.id,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      subtotal: sampleProduct3.basePrice,
      discount: 0,
      tax: 20.0,
      shippingFee: 0.0,
      total: sampleProduct3.basePrice + 20.0,
      deliveryOtp: otp3,
      items: {
        create: [
          {
            productId: sampleProduct3.id,
            variantId: sampleVariant3.id,
            productName: sampleProduct3.name,
            variantName: sampleVariant3.name,
            colorHex: sampleVariant3.colorHex,
            sku: sampleVariant3.sku,
            unitPrice: sampleProduct3.basePrice,
            quantity: 1,
            totalPrice: sampleProduct3.basePrice,
          },
        ],
      },
      payments: {
        create: {
          transactionId: "TXN_SIM_2026_994701",
          provider: "STRIPE_SIMULATED",
          amount: sampleProduct3.basePrice + 20.0,
          currency: "USD",
          status: "SUCCESS",
        },
      },
      delivery: {
        create: {
          partnerId: deliveryPartnerProfile.id,
          status: "DELIVERED",
          customerOtp: otp3,
          otpVerified: true,
          otpVerifiedAt: new Date(Date.now() - 86400000 * 2),
          deliveredAt: new Date(Date.now() - 86400000 * 2),
          recipientName: "Dhiman Roy",
        },
      },
    },
  });

  console.log("📦 Sample orders seeded (OUT_FOR_DELIVERY with OTP 492817, PROCESSING, DELIVERED)");

  // 6. CREATE VERIFIED CUSTOMER REVIEWS
  await prisma.review.createMany({
    data: [
      {
        productId: sampleProduct1.id,
        userId: customerUser.id,
        rating: 5,
        title: "Unmatched lightness and finish",
        comment: "I have worn luxury eyewear from Matsuda and Mykita for a decade. The Chronos Alpha feels lighter than featherweight and the titanium chamfering is exquisite.",
        isVerifiedPurchase: true,
      },
      {
        productId: sampleProduct2.id,
        userId: customerUser.id,
        rating: 5,
        title: "Crystal sharp polarized vision",
        comment: "The green-tinted polarized optics cut dashboard glare on Highway 1 completely. Excellent build quality.",
        isVerifiedPurchase: true,
      },
      {
        productId: createdProducts[18].id, // SoundWave Horizon
        userId: customerUser.id,
        rating: 5,
        title: "Audio clarity without covering ears",
        comment: "Can listen to Zoom calls while hearing city street noises safely. The titanium frame doesn't look like tech gadgetry—it looks like pure bespoke luxury.",
        isVerifiedPurchase: true,
      },
    ],
  });

  console.log("⭐ Verified customer reviews seeded");

  // 7. CREATE NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        title: "Delivery In Progress",
        message: "Your EYECAP Chronos Alpha order #EYE-2026-90412 is out for delivery! Your secure delivery OTP is 492817.",
        type: "DELIVERY",
        link: "/account/orders",
      },
      {
        userId: adminUser.id,
        title: "New Order Awaiting Assignment",
        message: "Order #EYE-2026-90413 for $319.00 is packed and ready for delivery partner dispatch.",
        type: "ORDER",
        link: "/admin/orders",
      },
      {
        userId: courierUser.id,
        title: "Active Delivery Assignment",
        message: "Order #EYE-2026-90412 is currently in your delivery route for 742 Evergreen Terrace.",
        type: "DELIVERY",
        link: "/delivery",
      },
    ],
  });

  console.log("🔔 System notifications seeded");
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
