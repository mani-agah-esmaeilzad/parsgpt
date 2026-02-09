import { format, subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { parseJson, parseStringArray } from "@/lib/serializers";

const DEFAULT_USER_WINDOW = 30;

function getSinceDate(days: number) {
  const window = Math.max(days, 1);
  return format(subDays(new Date(), window - 1), "yyyy-MM-dd");
}

function buildDateSeries(days: number) {
  const total = Math.max(days, 1);
  return Array.from({ length: total }, (_, idx) => {
    const offset = total - 1 - idx;
    return format(subDays(new Date(), offset), "yyyy-MM-dd");
  });
}

export async function getAdminSummary({
  tokensWindowDays = 7,
  trendDays = 30,
}: { tokensWindowDays?: number; trendDays?: number } = {}) {
  const since = getSinceDate(tokensWindowDays);

  const [users, gpts, conversations, messages, totalTokens, windowTokens] = await prisma.$transaction([
    prisma.user.count(),
    prisma.gPT.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.usageDaily.aggregate({ _sum: { totalTokens: true } }),
    prisma.usageDaily.aggregate({
      where: { date: { gte: since } },
      _sum: { totalTokens: true },
    }),
  ]);

  const dailyTrend = await getDailyUsage(trendDays);

  return {
    totals: {
      users,
      gpts,
      conversations,
      messages,
      tokensAllTime: totalTokens._sum.totalTokens ?? 0,
      tokensWindow: windowTokens._sum.totalTokens ?? 0,
    },
    dailyTrend,
  };
}

export async function getDailyUsage(days = 30) {
  const since = getSinceDate(days);
  const rows = await prisma.usageDaily.groupBy({
    by: ["date"],
    where: { date: { gte: since } },
    _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
    orderBy: { date: "asc" },
  });

  const valueMap = new Map(
    rows.map((row) => [
      row.date,
      {
        promptTokens: row._sum.promptTokens ?? 0,
        completionTokens: row._sum.completionTokens ?? 0,
        totalTokens: row._sum.totalTokens ?? 0,
      },
    ]),
  );
  return buildDateSeries(days).map((date) => ({
    date,
    promptTokens: valueMap.get(date)?.promptTokens ?? 0,
    completionTokens: valueMap.get(date)?.completionTokens ?? 0,
    totalTokens: valueMap.get(date)?.totalTokens ?? 0,
  }));
}

export async function getUsageByUser(days = DEFAULT_USER_WINDOW) {
  const since = getSinceDate(days);
  const usage = await prisma.usageDaily.groupBy({
    by: ["userId"],
    where: {
      userId: { not: null },
      date: { gte: since },
    },
    _sum: { totalTokens: true },
    orderBy: { _sum: { totalTokens: "desc" } },
  });

  const userIds = usage.map((row) => row.userId).filter((id): id is string => Boolean(id));
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    : [];

  return usage
    .filter((row) => row.userId)
    .map((row) => ({
      userId: row.userId!,
      tokens: row._sum.totalTokens ?? 0,
      user: users.find((user) => user.id === row.userId) ?? null,
    }));
}

export async function getUsageByGpt(days = DEFAULT_USER_WINDOW) {
  const since = getSinceDate(days);
  const usage = await prisma.usageDaily.groupBy({
    by: ["gptId"],
    where: {
      gptId: { not: null },
      date: { gte: since },
    },
    _sum: { totalTokens: true },
    orderBy: { _sum: { totalTokens: "desc" } },
  });

  const gptIds = usage.map((row) => row.gptId).filter((id): id is string => Boolean(id));
  const gpts = gptIds.length
    ? await prisma.gPT.findMany({
        where: { id: { in: gptIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];

  return usage
    .filter((row) => row.gptId)
    .map((row) => ({
      gptId: row.gptId!,
      tokens: row._sum.totalTokens ?? 0,
      gpt: gpts.find((gpt) => gpt.id === row.gptId) ?? null,
    }));
}

export async function getUsersWithStats({
  search,
  days = DEFAULT_USER_WINDOW,
}: {
  search?: string | null;
  days?: number;
}) {
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const since = getSinceDate(days);

  const [users, usageAll, usageWindow] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { conversations: true } },
      },
    }),
    prisma.usageDaily.groupBy({
      by: ["userId"],
      orderBy: { userId: "asc" },
      _sum: { totalTokens: true },
    }),
    prisma.usageDaily.groupBy({
      by: ["userId"],
      where: { date: { gte: since } },
      orderBy: { userId: "asc" },
      _sum: { totalTokens: true },
    }),
  ]);

  const totalsMap = new Map(usageAll.map((row) => [row.userId, row._sum.totalTokens ?? 0]));
  const windowMap = new Map(usageWindow.map((row) => [row.userId, row._sum.totalTokens ?? 0]));

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    conversations: user._count.conversations,
    tokensAllTime: totalsMap.get(user.id) ?? 0,
    tokensWindow: windowMap.get(user.id) ?? 0,
  }));
}

export async function getAdminGpts() {
  const gpts = await prisma.gPT.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return gpts.map((gpt) => ({
    ...gpt,
    tags: parseStringArray(gpt.tags),
    starterPrompts: parseStringArray(gpt.starterPrompts),
  }));
}

export async function getAdminGptById(id: string) {
  const gpt = await prisma.gPT.findUnique({ where: { id } });
  if (!gpt) {
    return null;
  }
  return {
    ...gpt,
    tags: parseStringArray(gpt.tags),
    starterPrompts: parseStringArray(gpt.starterPrompts),
  };
}

export async function getAdminAuditLogs({
  limit = 100,
  actionType,
}: {
  limit?: number;
  actionType?: string | null;
}) {
  const logs = await prisma.adminAudit.findMany({
    where: actionType ? { actionType } : undefined,
    include: {
      actor: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  return logs.map((log) => ({
    ...log,
    metadata: parseJson(log.metadata),
  }));
}
