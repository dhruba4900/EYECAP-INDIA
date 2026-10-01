import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { SessionUser, Role } from "./types";
import { prisma } from "./prisma";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const TOKEN_COOKIE_NAME = "eyecap_session_token";

const roles: Role[] = ["CUSTOMER", "ADMIN", "DELIVERY_PARTNER"];

function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.firstName !== "string" ||
      typeof decoded.lastName !== "string" ||
      typeof decoded.role !== "string" ||
      !isRole(decoded.role)
    ) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    // 1. Try cookie
    const cookieStore = cookies();
    const tokenFromCookie = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (tokenFromCookie) {
      const user = verifyToken(tokenFromCookie);
      if (user) return user;
    }

    // 2. Try Authorization Bearer header
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const tokenFromHeader = authHeader.substring(7);
      const user = verifyToken(tokenFromHeader);
      if (user) return user;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(allowedRoles?: Role[]): Promise<{ user: SessionUser } | { error: string; status: number }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { error: "Authentication required. Please log in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true },
  });
  if (!user || !user.isActive) {
    return { error: "Authentication required. Please log in.", status: 401 };
  }

  if (!isRole(user.role)) {
    return { error: "Forbidden: The account has no supported role.", status: 403 };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: "Forbidden: You do not have permission to access this resource.", status: 403 };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
}

export { TOKEN_COOKIE_NAME };
