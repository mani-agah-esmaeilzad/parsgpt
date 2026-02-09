import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getDailyUsage } from "@/lib/admin/queries";
import { reportDaysSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const parsed = reportDaysSchema.safeParse({ days: request.nextUrl.searchParams.get("days") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const daily = await getDailyUsage(parsed.data.days);
  return NextResponse.json({ daily });
}
