"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { isValidIranPhone, normalizeIranPhone, toEnglishDigits, toPersianDigits } from "@/lib/phone";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 90;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/chat";

  const [step, setStep] = useState<0 | 1>(0);
  const [phone, setPhone] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [counter, setCounter] = useState(RESEND_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setCounter(RESEND_SECONDS);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (step === 1) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, startTimer]);

  const requestCode = async (inputPhone: string) => {
    const normalized = normalizeIranPhone(inputPhone);
    if (!isValidIranPhone(normalized)) {
      setRequestError("شماره تلفن وارد شده معتبر نیست.");
      return false;
    }

    try {
      setIsRequesting(true);
      setRequestError(null);
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setRequestError(data?.error ?? "ارسال کد تایید با مشکل مواجه شد.");
        return false;
      }

      setPhone(normalized);
      setStep(1);
      setOtp(new Array(OTP_LENGTH).fill(""));
      resetTimer();
      return true;
    } catch {
      setRequestError("ارسال کد تایید با مشکل مواجه شد.");
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const englishValue = toEnglishDigits(value);
    if (englishValue && isNaN(Number(englishValue))) return;

    const next = [...otp];
    next[index] = englishValue;
    setOtp(next);
    setVerifyError(null);

    if (englishValue && index < OTP_LENGTH - 1) {
      (document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement | null)?.focus();
    }

    if (next.every((digit) => digit)) {
      void verifyCode(next.join(""));
    }
  };

  const verifyCode = async (code: string) => {
    if (!phone) {
      setVerifyError("شماره تلفن یافت نشد. دوباره تلاش کنید.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    const response = await signIn("credentials", {
      phone,
      code,
      redirect: false,
      callbackUrl,
    });
    setIsVerifying(false);

    if (!response?.error) {
      router.push(callbackUrl);
    } else {
      setVerifyError("کد وارد شده صحیح نیست.");
    }
  };

  const handleResend = async () => {
    if (counter > 0) return;
    await requestCode(phone);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="ParsGPT"
          width={120}
          height={120}
          className="size-24 md:size-28"
          priority
        />
      </Link>

      {step === 0 && (
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">به ParsGPT خوش آمدید!</h1>
            <p className="text-xs text-muted-foreground">
              شماره تلفن همراه خود را وارد کنید تا کد تایید برایتان ارسال شود.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-black/30">
            <div className="relative">
              <input
                id="phone"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                value={toPersianDigits(phone)}
                onChange={(event) => {
                  setPhone(toEnglishDigits(event.target.value));
                  if (requestError) setRequestError(null);
                }}
                className="peer block w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-center text-sm focus:border-[#9b956d] focus:outline-none dark:border-neutral-600"
              />
              <label
                htmlFor="phone"
                className={cn(
                  "absolute right-4 text-xs text-neutral-500 transition-all duration-200 ease-out",
                  phone.length ? "-top-2 bg-white px-1 dark:bg-black" : "top-3"
                )}
              >
                شماره موبایل
              </label>
            </div>

            <button
              type="button"
              disabled={isRequesting || !isValidIranPhone(normalizeIranPhone(phone))}
              onClick={() => requestCode(phone)}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-black text-white transition-all hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {isRequesting ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>

            <div className="min-h-[1.25rem]">
              {requestError && <p className="text-xs text-red-600">{requestError}</p>}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm">
              کد تایید به شماره {toPersianDigits(phone)} ارسال شد.
            </p>
            <button
              type="button"
              className="text-xs text-[#9b956d] hover:opacity-80"
              onClick={() => {
                setStep(0);
                setVerifyError(null);
                setOtp(new Array(OTP_LENGTH).fill(""));
              }}
            >
              تغییر شماره موبایل
            </button>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-black/30">
            <div className={cn("mb-4 flex gap-2", verifyError ? "shake" : "")} dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="tel"
                  value={toPersianDigits(digit)}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  className={cn(
                    "h-12 w-full rounded-2xl border text-center text-base transition-colors focus:outline-none",
                    verifyError ? "border-red-500" : "border-neutral-300 dark:border-neutral-600"
                  )}
                  maxLength={1}
                  disabled={isVerifying}
                />
              ))}
            </div>

            <div className="flex items-center justify-center text-xs text-muted-foreground">
              {counter > 0 ? (
                <span>{toPersianDigits(String(counter))} ثانیه تا ارسال مجدد</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#9b956d] hover:opacity-80"
                >
                  ارسال مجدد کد
                </button>
              )}
            </div>

            {verifyError && <p className="mt-3 text-xs text-red-600">{verifyError}</p>}
            {isVerifying && <p className="mt-3 text-xs text-muted-foreground">در حال بررسی...</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            با ورود، شما شرایط استفاده را می‌پذیرید.
            <Link href="/" className="mr-1 text-[#9b956d]">
              مشاهده قوانین
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
