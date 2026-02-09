"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { GptVisibility } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface AdminGptRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  tags: string[];
  systemPrompt: string;
  starterPrompts: string[];
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number | null;
  visibility: GptVisibility;
  enabled: boolean;
  updatedAt: string;
  category?: string | null;
}

interface Props {
  gpts: AdminGptRow[];
}

export function GptTable({ gpts }: Props) {
  const [items, setItems] = useState(gpts);
  const [isBusy, setIsBusy] = useState(false);

  const handleToggle = async (id: string, nextEnabled: boolean) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item)));
    try {
      setIsBusy(true);
      const response = await fetch(`/api/admin/gpts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toPayload(current),
          enabled: nextEnabled,
        }),
      });
      if (!response.ok) throw new Error("failed");
      toast.success("وضعیت GPT به‌روز شد");
    } catch (error) {
      console.error(error);
      toast.error("به‌روزرسانی وضعیت انجام نشد");
      setItems((prev) => prev.map((item) => (item.id === id ? current : item)));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این GPT مطمئن هستید؟")) return;
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/admin/gpts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      toast.success("GPT حذف شد");
    } catch (error) {
      console.error(error);
      toast.error("حذف انجام نشد");
      setItems(previous);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>GPT های سفارشی</CardTitle>
          <p className="text-sm text-muted-foreground">مدیریت دستیارها، وضعیت و دسترسی</p>
        </div>
        <Button asChild>
          <Link href="/admin/gpts/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> GPT جدید
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[840px] text-right">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">دسته</TableHead>
                <TableHead className="text-right">مدل</TableHead>
                <TableHead className="text-right">نمایش</TableHead>
                <TableHead className="text-right">آخرین بروزرسانی</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">اقدامات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((gpt) => (
                <TableRow key={gpt.id} className={isBusy ? "opacity-60" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{gpt.icon ?? "🤖"}</span>
                      <div>
                        <p className="font-medium">{gpt.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {gpt.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{gpt.category ?? "—"}</TableCell>
                  <TableCell>{gpt.model}</TableCell>
                  <TableCell>
                    <Badge variant={gpt.visibility === "PUBLIC" ? "secondary" : "outline"}>
                      {gpt.visibility === "PUBLIC" ? "عمومی" : "خصوصی"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(gpt.updatedAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={gpt.enabled} onCheckedChange={(checked) => handleToggle(gpt.id, checked)} />
                      <span className="text-xs text-muted-foreground">{gpt.enabled ? "فعال" : "غیرفعال"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/gpts/${gpt.id}`} className="flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" /> ویرایش
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(gpt.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function toPayload(gpt: AdminGptRow) {
  return {
    name: gpt.name,
    slug: gpt.slug,
    description: gpt.description,
    icon: gpt.icon ?? "",
    tags: gpt.tags,
    category: gpt.category ?? undefined,
    systemPrompt: gpt.systemPrompt,
    starterPrompts: gpt.starterPrompts,
    model: gpt.model,
    temperature: gpt.temperature,
    topP: gpt.topP,
    maxOutputTokens: gpt.maxOutputTokens ?? undefined,
    visibility: gpt.visibility,
    enabled: gpt.enabled,
  };
}
