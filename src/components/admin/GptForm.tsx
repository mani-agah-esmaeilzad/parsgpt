"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";

import type { GptVisibility } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AdminGptFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  tags: string[];
  category?: string | null;
  systemPrompt: string;
  starterPrompts: string[];
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number | null;
  visibility: GptVisibility;
  enabled: boolean;
}

interface GptFormProps {
  mode: "create" | "edit";
  gpt?: AdminGptFormValues;
}

const formSchema = z.object({
  name: z.string().min(2, "نام را وارد کنید"),
  slug: z.string().min(2, "نامک معتبر نیست"),
  description: z.string().min(10, "توضیحات کوتاه است"),
  icon: z.string().max(16).optional().or(z.literal("")),
  tags: z.string().optional(),
  category: z.string().optional(),
  systemPrompt: z.string().min(10, "سیستم پرامپت الزامی است"),
  starterPrompts: z.string().optional(),
  model: z.string().min(2),
  temperature: z.coerce.number().min(0).max(2),
  topP: z.coerce.number().min(0).max(1),
  maxOutputTokens: z
    .preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }
        return Number(value);
      },
      z.number().min(128).max(8192).nullable(),
    )
    .default(null),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function GptForm({ mode, gpt }: GptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: gpt?.name ?? "",
      slug: gpt?.slug ?? "",
      description: gpt?.description ?? "",
      icon: gpt?.icon ?? "",
      tags: gpt?.tags?.join(", ") ?? "",
      category: gpt?.category ?? "",
      systemPrompt: gpt?.systemPrompt ?? "",
      starterPrompts: gpt?.starterPrompts?.join("\n") ?? "",
      model: gpt?.model ?? "gpt-4o-mini",
      temperature: gpt?.temperature ?? 0.7,
      topP: gpt?.topP ?? 1,
      maxOutputTokens: gpt ? gpt.maxOutputTokens : 2048,
      visibility: gpt?.visibility ?? "PUBLIC",
      enabled: gpt?.enabled ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      icon: values.icon || "",
      tags:
        values.tags
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) ?? [],
      category: values.category?.trim() || undefined,
      systemPrompt: values.systemPrompt,
      starterPrompts:
        values.starterPrompts
          ?.split("\n")
          .map((prompt) => prompt.trim())
          .filter(Boolean) ?? [],
      model: values.model,
      temperature: values.temperature,
      topP: values.topP,
      maxOutputTokens: values.maxOutputTokens ?? undefined,
      visibility: values.visibility,
      enabled: values.enabled,
    };

    try {
      const endpoint = mode === "create" ? "/api/admin/gpts" : `/api/admin/gpts/${gpt?.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("GPT با موفقیت ذخیره شد");
      router.push("/admin/gpts");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("ذخیره GPT انجام نشد");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!gpt?.id) return;
    if (!confirm("این GPT حذف شود؟")) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/gpts/${gpt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      toast.success("GPT حذف شد");
      router.push("/admin/gpts");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("حذف انجام نشد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "GPT جدید" : "ویرایش GPT"}</CardTitle>
            <CardDescription>مقادیر مورد نیاز برای تولید پاسخ‌های شخصی‌سازی شده را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        if (!form.getValues("slug")?.trim()) {
                          form.setValue("slug", slugify(event.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نامک (slug)</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آیکون</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="🤖" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>دسته</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثلا: تولید محتوا" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>برچسب‌ها (با , جدا شود)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="عمومی, نوشتن" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تنظیمات مدل</CardTitle>
            <CardDescription>پارامترهای مدل پایه را مشخص کنید.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>مدل</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="gpt-4o-mini" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top P</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxOutputTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حداکثر توکن خروجی</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={128}
                      max={8192}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.onChange(nextValue === "" ? "" : Number(nextValue));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نمایش</FormLabel>
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PUBLIC">عمومی</SelectItem>
                      <SelectItem value="PRIVATE">خصوصی</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>وضعیت</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <Label>{field.value ? "فعال" : "غیرفعال"}</Label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>راهنما و پرامپت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} dir="auto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="starterPrompts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پیشنهاد شروع (هر خط یک مورد)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-between gap-3">
          {mode === "edit" && gpt?.id ? (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              <Trash2 className="ml-2 h-4 w-4" /> حذف GPT
            </Button>
          ) : <span />}
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره
          </Button>
        </div>
      </form>
    </Form>
  );
}

function slugify(value: string, fallback?: string) {
  const base = value || fallback || "";
  return base
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .slice(0, 60);
}
