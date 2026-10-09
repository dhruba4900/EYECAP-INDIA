
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.adminProfile.findMany({
    where: { isSuperAdmin: true },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          isActive: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        superAdminCount: accounts.length,
        accounts: accounts.map((account) => ({
          email: account.user.email,
          isActive: account.user.isActive,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Super Admin check failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
