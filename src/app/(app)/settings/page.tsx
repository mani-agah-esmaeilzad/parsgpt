import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="تنظیمات" />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
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
      </div>
    </div>
  );
}
