"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

const typingHints = [
  "نمونه قرارداد اجاره آپارتمان بنویس",
  "راهنمای ثبت شرکت در ایران",
  "متن لایحه برای مطالبه مهریه",
  "شرایط فسخ قرارداد خرید و فروش چیست؟",
  "برای سفر ۵ روزه به استانبول برنامه بده",
  "خلاصه قوانین مربوط به دیه چیست؟",
];

const TYPING_SPEED = 70;
const DELETING_SPEED = 30;
const PAUSE_DURATION = 1000;

export default function RootPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [value, setValue] = useState("");
  const [displayed, setDisplayed] = useState("");
  const [queryIndex, setQueryIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (value) {
      setDisplayed("");
      setCharIndex(0);
      setIsTyping(true);
      return;
    }

    const currentQuery = typingHints[queryIndex];
    if (isTyping) {
      if (charIndex < currentQuery.length) {
        const timeout = setTimeout(() => {
          setDisplayed(currentQuery.substring(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, TYPING_SPEED);
        return () => clearTimeout(timeout);
      }
      const pauseTimeout = setTimeout(() => setIsTyping(false), PAUSE_DURATION);
      return () => clearTimeout(pauseTimeout);
    }

    if (charIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayed(currentQuery.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, DELETING_SPEED);
      return () => clearTimeout(timeout);
    }

    setIsTyping(true);
    setQueryIndex((prev) => (prev + 1) % typingHints.length);
  }, [charIndex, isTyping, queryIndex, value]);

  const handleStart = () => {
    if (session?.user) {
      router.push("/chat?new=1");
      return;
    }
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-neutral-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10">
        <header className="flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight">ParsGPT</div>
          <button
            onClick={handleStart}
            className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            شروع گفتگو
          </button>
        </header>

        <main className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              دستیار فارسی‌زبان شما برای پاسخ سریع و دقیق
            </h1>
            <p className="max-w-xl text-sm text-neutral-700 md:text-base dark:text-white/80">
              تجربه‌ای شبیه Dadnoos با تمرکز روی گفتگوهای فارسی. ورود تنها با شماره موبایل و
              بدون نیاز به نام کاربری.
            </p>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                احراز هویت با موبایل
              </div>
              <div className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                محیط امن و سریع
              </div>
              <div className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                طراحی تمپلیت محور
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="space-y-4">
              <p className="text-sm font-medium text-neutral-700 dark:text-white/80">
                یک سوال بپرسید تا شروع کنیم
              </p>
              <textarea
                rows={3}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={displayed}
                className="w-full resize-none rounded-2xl border border-neutral-200 bg-transparent px-4 py-3 text-sm focus:border-neutral-400 focus:outline-none dark:border-white/10 dark:focus:border-white/30"
              />
              <button
                onClick={handleStart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >
                شروع با ParsGPT
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        <section className="mt-16 grid gap-4 text-xs text-neutral-700 md:grid-cols-3 dark:text-white/75">
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            پاسخ‌های سریع با تمرکز بر زبان فارسی و زمینه‌های پرکاربرد
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            بدون نیاز به نام کاربری یا ایمیل، فقط شماره موبایل
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            آماده نصب به‌عنوان PWA روی موبایل و دسکتاپ
          </div>
        </section>
      </div>
    </div>
  );
}
