import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken } from "@/lib/auth";
import { createAuditLog } from "@/services/audit.service";
import { AppError, ConflictError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";
import { registerSchema, loginSchema } from "@/validations/auth.schema";

export async function registerUser(input: z.infer<typeof registerSchema>, ipAddress?: string) {
  const existing = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash,
        role: input.role,
        accountStatus: "ACTIVE",
      },
    });

    if (input.role === "FOOD_PROVIDER") {
      await tx.foodProvider.create({
        data: {
          userId: user.id,
          organizationName: input.organizationName || `${input.name}'s Kitchen`,
          organizationType: input.organizationType || "RESTAURANT",
          address: input.address || "123 Green Way",
          city: input.city || "Metropolis",
          latitude: input.latitude || 28.6139,
          longitude: input.longitude || 77.2090,
          verificationStatus: "VERIFIED",
        },
      });
    } else if (input.role === "NGO") {
      await tx.ngo.create({
        data: {
          userId: user.id,
          organizationName: input.organizationName || `${input.name} Foundation`,
          address: input.address || "456 Relief Blvd",
          city: input.city || "Metropolis",
          latitude: input.latitude || 28.6250,
          longitude: input.longitude || 77.2180,
          foodCapacity: input.foodCapacity || 250,
          availabilityStatus: "AVAILABLE",
          verificationStatus: "VERIFIED",
        },
      });
    } else if (input.role === "DISTRIBUTOR") {
      await tx.distributor.create({
        data: {
          userId: user.id,
          vehicleType: input.vehicleType || "VAN",
          availabilityStatus: "AVAILABLE",
          reliabilityScore: 5.0,
        },
      });
    }

    return user;
  });

  await createAuditLog({
    userId: result.id,
    actorRole: result.role,
    action: "USER_REGISTERED",
    entity: "USER",
    entityId: result.id,
    ipAddress,
    metadata: { role: result.role, email: result.email },
  });

  return result;
}

export async function loginUser(input: z.infer<typeof loginSchema>, ipAddress?: string, userAgent?: string) {
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      foodProvider: true,
      ngo: true,
      distributor: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.accountStatus === "SUSPENDED") {
    throw new UnauthorizedError("Your account has been suspended. Please contact administrator.");
  }

  const isMatch = await verifyPassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  let orgId = undefined;
  let orgName = undefined;
  if (user.foodProvider) {
    orgId = user.foodProvider.id;
    orgName = user.foodProvider.organizationName;
  } else if (user.ngo) {
    orgId = user.ngo.id;
    orgName = user.ngo.organizationName;
  } else if (user.distributor) {
    orgId = user.distributor.id;
    orgName = user.name;
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role as any,
    accountStatus: user.accountStatus as any,
    organizationId: orgId,
    organizationName: orgName,
    avatarUrl: user.avatarUrl,
  };

  const token = await createSessionToken(sessionUser);

  await createAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: "USER_LOGIN",
    entity: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return { user: sessionUser, token };
}