import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSummary } from "@/lib/admin/queries";

const STAT_LABELS = [
  { key: "users", label: "کاربران" },
  { key: "gpts", label: "GPT ها" },
  { key: "conversations", label: "گفتگوها" },
  { key: "messages", label: "پیام‌ها" },
];

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();
  const { totals, dailyTrend } = summary;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_LABELS.map((item) => (
          <StatCard key={item.key} title={item.label} value={totals[item.key as keyof typeof totals] as number} />
        ))}
        <StatCard title="توکن (کل)" value={totals.tokensAllTime} highlight />
        <StatCard title="توکن ۷ روز اخیر" value={totals.tokensWindow} suffix="توکن" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نمودار ۳۰ روز اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={dailyTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>جزئیات روزانه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dailyTrend.slice(-7).map((row) => (
              <div key={row.date} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{row.date}</p>
                  <p className="text-xs text-muted-foreground">{row.promptTokens} ورودی · {row.completionTokens} خروجی</p>
                </div>
                <span className="font-semibold">{row.totalTokens}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight, suffix }: { title: string; value: number; highlight?: boolean; suffix?: string }) {
  return (
    <Card className={highlight ? "bg-primary/5" : undefined}>
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold" dir="ltr">
          {value.toLocaleString("fa-IR")}
          {suffix ? <span className="text-xs text-muted-foreground mr-2">{suffix}</span> : null}
        </p>
      </CardContent>
    </Card>
  );
}

function Sparkline({ data }: { data: { date: string; totalTokens: number }[] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">داده‌ای ثبت نشده است.</p>;
  }

  const max = Math.max(...data.map((row) => row.totalTokens), 1);
  const points = data
    .map((row, index) => {
      const x = (index / (data.length - 1 || 1)) * 280;
      const y = 120 - (row.totalTokens / max) * 120;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox="0 0 280 120" className="h-32 w-full">
        <polyline
          fill="none"
          strokeWidth="3"
          stroke="hsl(var(--primary))"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
