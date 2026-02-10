import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLAN_ORDER, getMonthlyQuestionUsage, getSubscriptionPlan, SUBSCRIPTION_PLANS } from "@/lib/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionPlan: true },
      })
    : null;

  const activePlanId = user?.subscriptionPlan ?? "FREE";
  const activePlan = getSubscriptionPlan(activePlanId);

  const usage = userId ? await getMonthlyQuestionUsage(userId) : { used: 0, start: new Date(), next: new Date() };
  const usedCount = usage.used;
  const monthlyLimit = activePlan.monthlyQuestions;
  const usagePercent = Math.min(100, Math.round((usedCount / Math.max(monthlyLimit, 1)) * 100));
  const remaining = Math.max(0, monthlyLimit - usedCount);
  const monthLabel = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(new Date());
  const formatNumber = (value: number) => value.toLocaleString("fa-IR");

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col overflow-y-auto">
      <PageHeader title="تنظیمات" />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>حساب کاربری</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div>
              <p className="text-sm text-muted-foreground">نام</p>
              <p className="font-medium">{session?.user?.name ?? "نامشخص"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ایمیل</p>
              <p className="font-medium" dir="ltr">{session?.user?.email}</p>
            </div>
            <Button variant="outline" disabled>
              تغییر رمز (به‌زودی)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اشتراک</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {SUBSCRIPTION_PLAN_ORDER.map((planId) => {
                const plan = SUBSCRIPTION_PLANS[planId];
                const isActive = plan.id === activePlanId;
                return (
                  <div
                    key={plan.id}
                    className={
                      "rounded-2xl border p-4 space-y-4 transition-colors " +
                      (isActive ? "border-primary bg-primary/5" : "border-border")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                      {isActive ? <Badge>پلن فعلی</Badge> : null}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold">{plan.priceLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        تا {formatNumber(plan.monthlyQuestions)} سوال در ماه
                      </p>
                    </div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {plan.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <Button variant={isActive ? "outline" : "default"} disabled className="w-full">
                      {isActive ? "پلن فعلی" : "ارتقا (به‌زودی)"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">سهمیه سوالات این ماه</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(usedCount)} از {formatNumber(monthlyLimit)} سوال
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(remaining)} سوال باقی‌مانده
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>ماه {monthLabel}</span>
                <span>{formatNumber(usagePercent)}٪ استفاده</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
