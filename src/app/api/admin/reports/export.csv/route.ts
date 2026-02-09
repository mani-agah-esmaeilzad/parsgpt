import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getDailyUsage, getUsageByGpt, getUsageByUser } from "@/lib/admin/queries";
import { reportExportSchema } from "@/lib/validators";

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export async function GET(request: NextRequest) {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const parsed = reportExportSchema.safeParse({
    days: request.nextUrl.searchParams.get("days") ?? undefined,
    type: request.nextUrl.searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { days, type } = parsed.data;
  let header: (string | number)[] = [];
  let dataRows: (string | number)[][] = [];

  if (type === "daily") {
    const daily = await getDailyUsage(days);
    header = ["date", "prompt_tokens", "completion_tokens", "total_tokens"];
    dataRows = daily.map((row) => [row.date, row.promptTokens, row.completionTokens, row.totalTokens]);
  } else if (type === "user") {
    const usage = await getUsageByUser(days);
    header = ["user_id", "user_email", "tokens"];
    dataRows = usage.map((row) => [row.userId, row.user?.email ?? "", row.tokens]);
  } else {
    const usage = await getUsageByGpt(days);
    header = ["gpt_id", "gpt_name", "tokens"];
    dataRows = usage.map((row) => [row.gptId, row.gpt?.name ?? "", row.tokens]);
  }

  const csv = toCsv([header, ...dataRows]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${type}-usage-${days}d.csv`,
    },
  });
}
