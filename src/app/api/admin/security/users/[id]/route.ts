import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

const updateAccountSchema = z.object({
  email: z.string().trim().email("Invalid email address").optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(12, "New password must be at least 12 characters").optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "DELIVERY_PARTNER"]).optional(),
  isSuperAdmin: z.boolean().optional(),
  department: z.string().trim().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { adminProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const auditActions: string[] = [];

    // Safeguard: Last Super Admin protection
    const isTargetSuperAdmin = targetUser.role === "ADMIN" && Boolean(targetUser.adminProfile?.isSuperAdmin);

    if (isTargetSuperAdmin) {
      const activeSuperAdminCount = await prisma.adminProfile.count({
        where: {
          isSuperAdmin: true,
          user: { isActive: true },
        },
      });

      if (activeSuperAdminCount <= 1) {
        if (data.isActive === false) {
          return NextResponse.json(
            { error: "Cannot deactivate the only active Super Administrator account." },
            { status: 403 }
          );
        }
        if (data.isSuperAdmin === false || (data.role && data.role !== "ADMIN")) {
          return NextResponse.json(
            { error: "Cannot revoke privileges from the only active Super Administrator account." },
            { status: 403 }
          );
        }
      }
    }

    // Check email uniqueness if changing email
    let normalizedNewEmail: string | undefined;
    if (data.email && data.email.toLowerCase() !== targetUser.email.toLowerCase()) {
      normalizedNewEmail = data.email.toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email: normalizedNewEmail },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Another account is already registered with this email address." },
          { status: 409 }
        );
      }
      auditActions.push(`EMAIL_CHANGED:${targetUser.email}->${normalizedNewEmail}`);
    }

    let passwordHash: string | undefined;
    if (data.newPassword) {
      passwordHash = await bcrypt.hash(data.newPassword, 12);
      auditActions.push("PASSWORD_RESET_EXECUTED");
    }

    if (data.isActive !== undefined && data.isActive !== targetUser.isActive) {
      auditActions.push(`STATUS_CHANGED:${targetUser.isActive}->${data.isActive}`);
    }

    if (data.role && data.role !== targetUser.role) {
      auditActions.push(`ROLE_CHANGED:${targetUser.role}->${data.role}`);
    }

    if (data.isSuperAdmin !== undefined && data.isSuperAdmin !== targetUser.adminProfile?.isSuperAdmin) {
      auditActions.push(`SUPERADMIN_PRIVILEGE_CHANGED:${targetUser.adminProfile?.isSuperAdmin}->${data.isSuperAdmin}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdateData: any = {};
      if (normalizedNewEmail) userUpdateData.email = normalizedNewEmail;
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.phone !== undefined) userUpdateData.phone = data.phone;
      if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
      if (data.role) userUpdateData.role = data.role;
      if (passwordHash) userUpdateData.passwordHash = passwordHash;

      const user = await tx.user.update({
        where: { id },
        data: userUpdateData,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          updatedAt: true,
          adminProfile: true,
        },
      });

      // Update or create adminProfile if role is or becomes ADMIN
      if (data.role === "ADMIN" || (targetUser.role === "ADMIN" && data.role === undefined)) {
        if (targetUser.adminProfile) {
          await tx.adminProfile.update({
            where: { userId: id },
            data: {
              ...(data.isSuperAdmin !== undefined ? { isSuperAdmin: data.isSuperAdmin } : {}),
              ...(data.department ? { department: data.department } : {}),
            },
          });
        } else {
          await tx.adminProfile.create({
            data: {
              userId: id,
              department: data.department || "Operations",
              isSuperAdmin: Boolean(data.isSuperAdmin),
              accessLevel: data.isSuperAdmin ? 10 : 5,
            },
          });
        }
      }

      for (const action of auditActions) {
        await tx.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: `SECURITY_${action.split(":")[0]}`,
            entityType: "User",
            entityId: id,
            details: JSON.stringify({
              targetId: id,
              targetEmail: user.email,
              change: action,
            }),
          },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      user: updated,
      message: "Account updated successfully.",
    });
  } catch (error) {
    console.error("Security user PATCH error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
