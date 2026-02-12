import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminAuditLogs } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{
    actionType?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  const { actionType } = await searchParams

  const logs = await getAdminAuditLogs({ actionType });
  const actionTypes = Array.from(new Set(logs.map((log) => log.actionType)));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>فیلتر رویدادها</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <FilterChip href="/admin/audit" active={!actionType} label="همه" />
          {actionTypes.map((action) => (
            <FilterChip
              key={action as any}
              href={`/admin/audit?actionType=${action}`}
              label={action}
              active={actionType === action}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تاریخچه ممیزی</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">رویدادی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px] text-right">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">زمان</TableHead>
                    <TableHead className="text-right">کاربر</TableHead>
                    <TableHead className="text-right">اقدام</TableHead>
                    <TableHead className="text-right">موجودیت</TableHead>
                    <TableHead className="text-right">جزئیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>{log.actor?.name ?? "سیستم"}</span>
                          <span dir="ltr" className="text-muted-foreground">
                            {log.actor?.email ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{log.entityType}</p>
                          {log.entityId && (
                            <p dir="ltr" className="text-muted-foreground">
                              {log.entityId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <pre className="max-w-xs overflow-x-auto rounded bg-muted/40 p-2 text-[11px]" dir="ltr">
                          {JSON.stringify(log.metadata ?? {}, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: any; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
