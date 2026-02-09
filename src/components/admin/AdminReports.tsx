"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SummaryTotals {
  users: number;
  gpts: number;
  conversations: number;
  messages: number;
  tokensAllTime: number;
  tokensWindow: number;
}

interface SummaryData {
  totals: SummaryTotals;
}

interface DailyPoint {
  date: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

interface ReportsProps {
  initialSummary: SummaryData;
  initialDaily: DailyPoint[];
  initialByUser: { userId: string; tokens: number; user: { email: string | null } | null }[];
  initialByGpt: { gptId: string; tokens: number; gpt: { name: string | null } | null }[];
}

const DAY_OPTIONS = [7, 30, 90];

export function AdminReports({ initialSummary, initialDaily, initialByUser, initialByGpt }: ReportsProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [daily, setDaily] = useState(initialDaily);
  const [byUser, setByUser] = useState(initialByUser);
  const [byGpt, setByGpt] = useState(initialByGpt);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, dailyRes, userRes, gptRes] = await Promise.all([
          fetch("/api/admin/summary"),
          fetch(`/api/admin/reports/daily?days=${days}`),
          fetch(`/api/admin/reports/by-user?days=${days}`),
          fetch(`/api/admin/reports/by-gpt?days=${days}`),
        ]);
        if (!summaryRes.ok || !dailyRes.ok || !userRes.ok || !gptRes.ok) {
          throw new Error("failed");
        }
        const [summaryData, dailyData, userData, gptData] = await Promise.all([
          summaryRes.json() as Promise<SummaryData>,
          dailyRes.json() as Promise<{ daily: DailyPoint[] }>,
          userRes.json() as Promise<{ usage: typeof initialByUser }>,
          gptRes.json() as Promise<{ usage: typeof initialByGpt }>,
        ]);
        if (!isMounted) return;
        setSummary(summaryData);
        setDaily(dailyData.daily);
        setByUser(userData.usage);
        setByGpt(gptData.usage);
      } catch (error) {
        console.error(error);
        toast.error("بارگذاری گزارش‌ها ناموفق بود");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [days]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>خلاصه کلی</CardTitle>
            <p className="text-sm text-muted-foreground">مقادیر کل و بازه {days} روز اخیر</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={days === option ? "default" : "outline"}
                onClick={() => setDays(option)}
              >
                {option} روز
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="کاربران" value={summary.totals.users} />
          <Metric label="گفتگوها" value={summary.totals.conversations} />
          <Metric label="پیام‌ها" value={summary.totals.messages} />
          <Metric label="توکن کل" value={summary.totals.tokensAllTime} />
          <Metric label={`توکن ${days} روز`} value={summary.totals.tokensWindow} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>توکن روزانه</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">داده‌ای یافت نشد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">ورودی</TableHead>
                  <TableHead className="text-right">خروجی</TableHead>
                  <TableHead className="text-right">مجموع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>{row.promptTokens.toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{row.completionTokens.toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{row.totalTokens.toLocaleString("fa-IR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>توکن به تفکیک کاربران</CardTitle>
            <ExportButton href={`/api/admin/reports/export.csv?type=user&days=${days}`} />
          </CardHeader>
          <CardContent>
            <UsageTable
              rows={byUser.map((row) => ({ label: row.user?.email ?? "نامشخص", tokens: row.tokens }))}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>توکن به تفکیک GPT</CardTitle>
            <ExportButton href={`/api/admin/reports/export.csv?type=gpt&days=${days}`} />
          </CardHeader>
          <CardContent>
            <UsageTable
              rows={byGpt.map((row) => ({ label: row.gpt?.name ?? "نامشخص", tokens: row.tokens }))}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>دریافت CSV کامل</CardTitle>
          <ExportButton href={`/api/admin/reports/export.csv?type=daily&days=${days}`} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">فایل شامل جزئیات روزانه با تفکیک ورودی و خروجی است.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border px-4 py-3 text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold" dir="ltr">
        {value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}

function UsageTable({ rows, isLoading }: { rows: { label: string; tokens: number }[]; isLoading: boolean }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">داده‌ای ثبت نشده است.</p>;
  }
  return (
    <div className={isLoading ? "opacity-60" : undefined}>
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell>{row.label}</TableCell>
              <TableCell className="text-left font-semibold" dir="ltr">
                {row.tokens.toLocaleString("fa-IR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExportButton({ href }: { href: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={href} rel="noreferrer">
        <Download className="ml-2 h-4 w-4" /> دانلود
      </a>
    </Button>
  );
}
