import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

interface UsageParams {
  userId: string;
  gptId: string;
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
        userId,
        gptId,
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
