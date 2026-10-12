import { db } from "@/lib/db";
import { UserRole } from "@/types";

export interface LogAuditParams {
  userId?: string | null;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export async function createAuditLog(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        userId: params.userId,
        actorRole: params.actorRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    // Non-blocking log failure
    console.error("Audit log creation error:", err);
  }
}

export interface TraceabilityParams {
  donationId: string;
  stage: string;
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  location?: string | null;
  metadata?: Record<string, any>;
}

export async function recordTraceability(params: TraceabilityParams) {
  try {
    return await db.traceabilityLog.create({
      data: {
        donationId: params.donationId,
        stage: params.stage,
        actor: params.actor,
        actorRole: params.actorRole,
        action: params.action,
        description: params.description,
        location: params.location,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("Traceability log error:", err);
  }
}