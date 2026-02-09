import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

interface UsageParams {
  userId?: string | null;
  gptId?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export async function recordDailyUsage({
  userId,
  gptId,
  promptTokens,
  completionTokens,
  totalTokens,
}: UsageParams) {
  const date = format(new Date(), "yyyy-MM-dd");

  await prisma.usageDaily.upsert({
    where: {
      date_userId_gptId: {
        date,
        userId: userId ?? null,
        gptId: gptId ?? null,
      },
    },
    update: {
      promptTokens: { increment: promptTokens },
      completionTokens: { increment: completionTokens },
      totalTokens: { increment: totalTokens },
    },
    create: {
      date,
      userId,
      gptId,
      promptTokens,
      completionTokens,
      totalTokens,
    },
  });
}
