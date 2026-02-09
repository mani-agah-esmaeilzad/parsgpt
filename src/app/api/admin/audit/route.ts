import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminAuditLogs } from "@/lib/admin/queries";
import { adminAuditQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const parsed = adminAuditQuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    actionType: request.nextUrl.searchParams.get("actionType") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const logs = await getAdminAuditLogs(parsed.data);
  return NextResponse.json({ logs });
}
