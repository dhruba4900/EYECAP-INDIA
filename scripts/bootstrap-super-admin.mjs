
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EYECAP_BOOTSTRAP_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.EYECAP_BOOTSTRAP_ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide a valid bootstrap admin email.");
  }

  if (!password || password.length < 16) {
    throw new Error(
      "The initial Super Admin password must be at least 16 characters."
    );
  }

  const existingSuperAdmin = await prisma.adminProfile.findFirst({
    where: { isSuperAdmin: true },
    select: { id: true },
  });

  if (existingSuperAdmin) {
    throw new Error(
      "A Super Admin already exists. Bootstrap has been refused."
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error(
      "This email already belongs to a user. Bootstrap has been refused."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      firstName: "EYECAP",
      lastName: "Security Admin",
      isActive: true,
      adminProfile: {
        create: {
          department: "Security Operations",
          isSuperAdmin: true,
          accessLevel: 10,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      adminProfile: {
        select: { isSuperAdmin: true },
      },
    },
  });

  console.log("Initial Super Admin created successfully.");
  console.log("User ID:", admin.id);
  console.log("Email:", admin.email);
  console.log("Role:", admin.role);
  console.log("Super Admin:", admin.adminProfile?.isSuperAdmin);
  console.log("Password was never printed or stored as plaintext.");
}

main()
  .catch((error) => {
    console.error("Super Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
