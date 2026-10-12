import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  role: z.enum(["CUSTOMER", "ADMIN", "DELIVERY_PARTNER"]),
  isSuperAdmin: z.boolean().optional().default(false),
  department: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role && ["CUSTOMER", "ADMIN", "DELIVERY_PARTNER"].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          adminProfile: {
            select: {
              id: true,
              department: true,
              isSuperAdmin: true,
              accessLevel: true,
            },
          },
          deliveryPartner: {
            select: {
              id: true,
              vehicleType: true,
              vehiclePlate: true,
              isAvailable: true,
              currentZone: true,
              rating: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Security users GET error:", error);
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role, isSuperAdmin, department, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          role,
          phone: phone || null,
          isActive: true,
          ...(role === "ADMIN"
            ? {
                adminProfile: {
                  create: {
                    department: department || "Operations",
                    isSuperAdmin: Boolean(isSuperAdmin),
                    accessLevel: isSuperAdmin ? 10 : 5,
                  },
                },
              }
            : {}),
          ...(role === "DELIVERY_PARTNER"
            ? {
                deliveryPartner: {
                  create: {
                    vehicleType: "Standard",
                    vehiclePlate: "PENDING",
                    currentZone: "Standard Delivery",
                  },
                },
              }
            : {}),
          ...(role === "CUSTOMER"
            ? {
                customerProfile: {
                  create: {
                    loyaltyPoints: 100,
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          adminProfile: {
            select: {
              isSuperAdmin: true,
              department: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "SECURITY_ACCOUNT_CREATED",
          entityType: "User",
          entityId: created.id,
          details: JSON.stringify({
            targetEmail: created.email,
            targetRole: created.role,
            isSuperAdmin: Boolean(created.adminProfile?.isSuperAdmin),
          }),
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Security users POST error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
