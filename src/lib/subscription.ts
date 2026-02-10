import { addMonths, startOfMonth } from "date-fns";
import type { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SubscriptionPlanConfig = {
  id: SubscriptionPlan;
  name: string;
  priceLabel: string;
  description: string;
  monthlyQuestions: number;
  highlights: string[];
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  FREE: {
    id: "FREE",
    name: "رایگان",
    priceLabel: "رایگان",
    description: "برای شروع و استفاده سبک روزانه",
    monthlyQuestions: 50,
    highlights: ["دسترسی به GPT های عمومی", "پشتیبانی محدود"],
  },
  PLUS: {
    id: "PLUS",
    name: "پلاس",
    priceLabel: "ماهانه",
    description: "برای کاربرانی که مصرف منظم دارند",
    monthlyQuestions: 300,
    highlights: ["اولویت پاسخ", "دسترسی سریع‌تر"],
  },
  PRO: {
    id: "PRO",
    name: "پرو",
    priceLabel: "ماهانه",
    description: "برای تیم‌ها و مصرف سنگین",
    monthlyQuestions: 2000,
    highlights: ["سهمیه بالا", "پشتیبانی ویژه"],
  },
};

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlan[] = ["FREE", "PLUS", "PRO"];

export function getSubscriptionPlan(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan] ?? SUBSCRIPTION_PLANS.FREE;
}

export async function getMonthlyQuestionUsage(userId: string) {
  const start = startOfMonth(new Date());
  const next = addMonths(start, 1);

  const used = await prisma.message.count({
    where: {
      role: "user",
      createdAt: {
        gte: start,
        lt: next,
      },
      conversation: {
        userId,
      },
    },
  });

  return { used, start, next };
}
