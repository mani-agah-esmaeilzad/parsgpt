import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getUsersWithStats } from "@/lib/admin/queries";
import { adminUsersQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const parsed = adminUsersQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    days: request.nextUrl.searchParams.get("days") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const users = await getUsersWithStats({
    search: parsed.data.q,
    days: parsed.data.days,
  });

  return NextResponse.json({ users });
}
