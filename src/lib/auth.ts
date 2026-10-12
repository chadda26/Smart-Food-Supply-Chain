import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SessionUser, UserRole } from "@/types";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_fallback_secret_key_change_in_production_32_chars"
);

const SESSION_COOKIE_NAME = "auth_session_token";
const SESSION_EXPIRY = "7d"; // 7 days

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountStatus: user.accountStatus,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      accountStatus: payload.accountStatus as any,
      organizationId: payload.organizationId as string | undefined,
      organizationName: payload.organizationName as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Verify that the user exists and is active in database
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      foodProvider: true,
      ngo: true,
      distributor: true,
    },
  });

  if (!user || user.accountStatus === "SUSPENDED") return null;

  let orgId = undefined;
  let orgName = undefined;

  const effectiveRole = String(user.role || session.role || "").trim().toUpperCase() as UserRole;

  if (effectiveRole === "FOOD_PROVIDER" && user.foodProvider) {
    orgId = user.foodProvider.id;
    orgName = user.foodProvider.organizationName;
  } else if (effectiveRole === "NGO" && user.ngo) {
    orgId = user.ngo.id;
    orgName = user.ngo.organizationName;
  } else if (effectiveRole === "DISTRIBUTOR" && user.distributor) {
    orgId = user.distributor.id;
    orgName = user.name;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: effectiveRole,
    accountStatus: user.accountStatus as any,
    organizationId: orgId,
    organizationName: orgName,
    avatarUrl: user.avatarUrl,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError("Please log in to access this feature.");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole | UserRole[] | string | string[]): Promise<SessionUser> {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const normalizedUserRole = String(user.role || "").trim().toUpperCase();
  const normalizedAllowedRoles = roles.map((r) => String(r || "").trim().toUpperCase());

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    throw new ForbiddenError(`Access denied. Requires one of: ${roles.join(", ")}`);
  }
  return user;
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}