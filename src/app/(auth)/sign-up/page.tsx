"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    setIsSubmitting(false);
    if (response.ok) {
      await signIn("credentials", { email, password, redirect: false });
      router.push("/chat");
    } else {
      toast.error("ثبت نام انجام نشد");
    }
  };

  return (
    <div className="space-y-6 text-right">
      <div>
        <h1 className="text-2xl font-bold">ایجاد حساب جدید</h1>
        <p className="text-sm text-muted-foreground">فرم زیر را تکمیل کنید</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">نام</Label>
          <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            dir="ltr"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">کلمه عبور</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">تکرار کلمه عبور</Label>
          <Input
            id="confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "در حال ساخت حساب..." : "ساخت حساب"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        حساب دارید؟ <Link href="/sign-in" className="text-primary">ورود</Link>
      </p>
    </div>
  );
}
