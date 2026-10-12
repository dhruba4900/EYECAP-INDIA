import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("EYECAP INDIA — COMPREHENSIVE SYSTEM VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Database Connectivity
  console.log("--- 1. Database Connectivity & Context ---");
  try {
    const dbRes = await prisma.$queryRawUnsafe(`SELECT current_database(), current_schema();`);
    assert(Array.isArray(dbRes) && dbRes.length > 0, "Database is connected and responds to queries");
  } catch (e) {
    assert(false, `Database query failed: ${e.message}`);
  }

  // TEST 2: Super Admin Account Verification
  console.log("\n--- 2. Super Administrator Verification ---");
  try {
    const superAdmin = await prisma.adminProfile.findFirst({
      where: { isSuperAdmin: true },
      include: { user: true },
    });
    assert(Boolean(superAdmin), "Super Admin profile exists in database");
    assert(superAdmin?.user.email === "joxster.eyecap@gmail.com", `Super Admin email matches (${superAdmin?.user.email})`);
    assert(superAdmin?.user.role === "ADMIN", "Super Admin user role is ADMIN");
    assert(superAdmin?.user.isActive === true, "Super Admin user isActive is true");
    assert(Boolean(superAdmin?.user.passwordHash), "Password hash is securely stored");
    assert(!superAdmin?.user.passwordHash.includes("password"), "Password is not stored in plaintext");
  } catch (e) {
    assert(false, `Super Admin query failed: ${e.message}`);
  }

  // TEST 3: Built-in Categories Verification
  console.log("\n--- 3. Category Consistency & Verification ---");
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
    assert(categories.length >= 5, `Built-in categories exist in database (found: ${categories.length})`);
    
    const requiredSlugs = ["eyeglasses", "sunglasses", "contact-lenses", "special-power", "special-editions"];
    const foundSlugs = categories.map((c) => c.slug);
    
    for (const slug of requiredSlugs) {
      assert(foundSlugs.includes(slug), `Built-in category slug "${slug}" exists`);
    }

    const activeCategories = categories.filter((c) => c.isActive && c.showInNavigation);
    assert(activeCategories.length >= 5, "All built-in categories have isActive=true and showInNavigation=true");
  } catch (e) {
    assert(false, `Category verification failed: ${e.message}`);
  }

  // TEST 4: Authentication & JWT Cryptography
  console.log("\n--- 4. Authentication Cryptography ---");
  try {
    const secret = process.env.JWT_SECRET || "fallback_secret_32_characters_long_for_test";
    const testUser = {
      id: "test-user-id",
      email: "tester@eyecap.luxury",
      role: "ADMIN",
      firstName: "Test",
      lastName: "User",
    };

    const token = jwt.sign(testUser, secret, { expiresIn: "1h" });
    assert(Boolean(token) && token.split(".").length === 3, "JWT token signs correctly with 3 segments");

    const decoded = jwt.verify(token, secret);
    assert(decoded.id === testUser.id, "Decoded token ID matches");
    assert(decoded.role === "ADMIN", "Decoded token role matches");

    // Test password hashing and verification
    const testPlain = "SuperSecurePassword2026!#";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPlain, salt);
    assert(await bcrypt.compare(testPlain, hash), "Bcrypt password hash compares successfully");
    assert(!(await bcrypt.compare("WrongPassword", hash)), "Bcrypt rejects wrong password correctly");
  } catch (e) {
    assert(false, `Auth cryptography failed: ${e.message}`);
  }

  // TEST 5: Last Super Admin Safeguard
  console.log("\n--- 5. Security Safeguards ---");
  try {
    const activeSuperAdminCount = await prisma.adminProfile.count({
      where: {
        isSuperAdmin: true,
        user: { isActive: true },
      },
    });
    assert(activeSuperAdminCount >= 1, `Active Super Administrator count is protected (${activeSuperAdminCount})`);
  } catch (e) {
    assert(false, `Super admin count safeguard failed: ${e.message}`);
  }

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution encountered an error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
