import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { streamChatCompletion, type ProviderMessage } from "@/lib/ai/provider";
import { logAdminAction } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordDailyUsage } from "@/lib/usage";
import { chatRequestSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import type { MessageRole } from "@prisma/client";

const DEFAULT_TITLE = "گفتگو جدید";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "نیاز به ورود دارید" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { conversationId, gptId, userMessage, regenerate } = parsed.data;

  if (!conversationId && !gptId) {
    return NextResponse.json({ error: "شناسه GPT الزامی است" }, { status: 400 });
  }

  const limiterKey = `chat:${session.user.id}`;
  const rate = checkRateLimit(limiterKey);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "لطفا کمی صبر کنید", retryAfter: rate.retryAfter },
      { status: 429 },
    );
  }

  const conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        include: { gpt: true },
      })
    : null;

  let gpt = conversation?.gpt ?? null;
  if (!gpt) {
    gpt = await prisma.gPT.findUnique({ where: { id: gptId! } });
  }

  if (!gpt || !gpt.enabled) {
    return NextResponse.json({ error: "این GPT در دسترس نیست" }, { status: 404 });
  }

  if (gpt.visibility === "PRIVATE" && session.user.role !== "ADMIN") {
    await logAdminAction({
      actorUserId: session.user.id,
      actionType: "blocked_private_gpt",
      entityType: "GPT",
      entityId: gpt.id,
    });
    return NextResponse.json({ error: "اجازه دسترسی ندارید" }, { status: 403 });
  }

  const activeConversation =
    conversation ??
    (await prisma.conversation.create({
      data: {
        userId: session.user.id,
        gptId: gpt.id,
      },
      include: { gpt: true },
    }));

  let historyMessages = await prisma.message.findMany({
    where: { conversationId: activeConversation.id },
    orderBy: { createdAt: "asc" },
  });

  let workingUserMessage = userMessage ?? "";

  if (regenerate) {
    if (!conversationId) {
      return NextResponse.json({ error: "برای تولید مجدد باید گفت‌وگو انتخاب شود" }, { status: 400 });
    }

    const lastAssistant = [...historyMessages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (lastAssistant) {
      await prisma.message.delete({ where: { id: lastAssistant.id } });
      historyMessages = historyMessages.filter((msg) => msg.id !== lastAssistant.id);
    }

    const lastUser = [...historyMessages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUser) {
      return NextResponse.json({ error: "پیام قبلی برای بازتولید یافت نشد" }, { status: 400 });
    }

    workingUserMessage = lastUser.content;
  } else {
    if (!workingUserMessage.trim()) {
      return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });
    }

    const createdUserMessage = await prisma.message.create({
      data: {
        conversationId: activeConversation.id,
        role: "user",
        content: workingUserMessage,
      },
    });

    historyMessages.push(createdUserMessage);
  }

  const providerMessages: ProviderMessage[] = [
    { role: "system" as MessageRole, content: gpt.systemPrompt },
    ...historyMessages.map((message) => ({
      role: message.role as MessageRole,
      content: message.content,
    })),
  ].map(({ role, content }) => ({
    role: role === "system" ? "system" : role === "assistant" ? "assistant" : "user",
    content,
  }));

  const { stream, finalResult } = await streamChatCompletion({
    messages: providerMessages,
    model: gpt.model,
    temperature: gpt.temperature,
    topP: gpt.topP,
    maxOutputTokens: gpt.maxOutputTokens ?? undefined,
    signal: request.signal,
  });

  const shouldRename = !activeConversation.title || activeConversation.title === DEFAULT_TITLE;

  finalResult
    .then(async ({ content, usage }) => {
      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: activeConversation.id,
            role: "assistant",
            content,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            modelUsed: usage.model,
            provider: usage.provider,
            tokensEstimated: usage.estimated,
          },
        }),
        prisma.conversation.update({
          where: { id: activeConversation.id },
          data: {
            updatedAt: new Date(),
            title: shouldRename ? buildTitle(workingUserMessage) : undefined,
          },
        }),
      ]);

      await recordDailyUsage({
        userId: session.user.id,
        gptId: gpt!.id,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      });
    })
    .catch((error) => {
      console.error("Failed to persist assistant response", error);
    });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Conversation-Id": activeConversation.id,
      "X-Gpt-Id": gpt.id,
    },
  });
}

function buildTitle(message: string) {
  const title = message.trim().slice(0, 32);
  return title.length === message.trim().length ? title : `${title}…`;
}
