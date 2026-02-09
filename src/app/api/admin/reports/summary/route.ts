import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminSummary } from "@/lib/admin/queries";

export async function GET() {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const summary = await getAdminSummary();
  return NextResponse.json(summary);
}
