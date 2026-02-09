import { prisma } from "@/lib/prisma";
import { stringifyJson } from "@/lib/serializers";

interface AuditParams {
  actorUserId?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
}

export async function logAdminAction(params: AuditParams) {
  const { actorUserId, actionType, entityType, entityId, metadata } = params;
  try {
    await prisma.adminAudit.create({
      data: {
        actorUserId,
        actionType,
        entityType,
        entityId,
        metadata: metadata ? stringifyJson(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write admin audit log", error);
  }
}
