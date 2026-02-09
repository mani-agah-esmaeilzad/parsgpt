"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import type { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  conversations: number;
  tokensAllTime: number;
  tokensWindow: number;
}

interface UserTableProps {
  initialUsers: AdminUserRow[];
  initialQuery?: string;
  initialDays?: number;
}

const DAY_OPTIONS = [7, 30, 90];

export function UserTable({ initialUsers, initialQuery = "", initialDays = 30 }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState(initialQuery);
  const [days, setDays] = useState(initialDays);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const delay = hasFetchedRef.current ? 400 : 0;
    const handler = setTimeout(() => {
      fetchUsers(query, days);
      hasFetchedRef.current = true;
    }, delay);
    return () => clearTimeout(handler);
  }, [query, days]);

  const totals = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.tokensAllTime += user.tokensAllTime;
        acc.tokensWindow += user.tokensWindow;
        return acc;
      },
      { tokensAllTime: 0, tokensWindow: 0 },
    );
  }, [users]);

  const fetchUsers = async (q: string, currentDays: number) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("days", String(currentDays));

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { users: AdminUserRow[] };
      setUsers(data.users);
    } catch (error) {
      console.error(error);
      toast.error("دریافت لیست کاربران ناموفق بود");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    const previous = users;
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, role } : user)));

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("نقش کاربر به‌روزرسانی شد");
    } catch (error) {
      console.error(error);
      toast.error("تغییر نقش انجام نشد");
      setUsers(previous);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>کاربران</CardTitle>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس ایمیل یا نام"
              className="pr-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="بازه" />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} روز اخیر
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => fetchUsers(query, days)} disabled={isLoading}>
            تازه‌سازی
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px] text-right">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">کاربر</TableHead>
                <TableHead className="text-right">ایمیل</TableHead>
                <TableHead className="text-right">تاریخ عضویت</TableHead>
                <TableHead className="text-right">نقش</TableHead>
                <TableHead className="text-right">گفتگوها</TableHead>
                <TableHead className="text-right">توکن {days} روز</TableHead>
                <TableHead className="text-right">توکن کل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={cn(isLoading && "opacity-60")}> 
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-xs text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as Role)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{user.conversations}</TableCell>
                  <TableCell>{user.tokensWindow.toLocaleString("fa-IR")}</TableCell>
                  <TableCell>{user.tokensAllTime.toLocaleString("fa-IR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>جمع توکن {days} روز: {totals.tokensWindow.toLocaleString("fa-IR")}</span>
          <span>جمع کل: {totals.tokensAllTime.toLocaleString("fa-IR")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
