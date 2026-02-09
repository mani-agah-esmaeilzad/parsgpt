import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userRoleSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAdminAction } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, status } = await requireAdmin({ redirect: false });
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const body = await request.json();
  const parsed = userRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  });

  await logAdminAction({
    actorUserId: user.id,
    actionType: "change_role",
    entityType: "User",
    entityId: id,
    metadata: parsed.data,
  });

  return NextResponse.json({ user: updatedUser });
}
