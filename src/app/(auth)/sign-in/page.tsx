"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/chat";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setIsSubmitting(false);
    if (!response?.error) {
      setError(null);
      router.push(callbackUrl);
    } else {
      setError("ایمیل یا رمز عبور نادرست است");
    }
  };

  return (
    <div className="space-y-6 text-right">
      <div>
        <h1 className="text-2xl font-bold">ورود به ParsGPT</h1>
        <p className="text-sm text-muted-foreground">حساب کاربری خود را وارد کنید</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "در حال ورود..." : "ورود"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <p className="text-sm text-muted-foreground">
        حساب ندارید؟ <Link href="/sign-up" className="text-primary">ثبت نام</Link>
      </p>
    </div>
  );
}
