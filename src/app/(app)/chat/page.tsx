import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { mapGpt } from "@/lib/gpts";
import { ChatView } from "@/components/chat/ChatView";
import type { UiConversation } from "@/types/chat";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  searchParams: Promise<{
    conversationId?: string;
    gptId?: string;
    new?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Chatpars | گفتگو",
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await getServerSession(authOptions);

  const { conversationId, gptId: requestedGptId, new: newParam } =
    await searchParams;

  const isNewChat = newParam === "1";

  let availableGpts = [];
  let initialConversation: UiConversation | null = null;

  if (session?.user?.id) {
    const userId = session.user.id;
    const role = session.user.role;

    const availableGptsRaw = await prisma.gPT.findMany({
      where:
        role === "ADMIN"
          ? { enabled: true }
          : { enabled: true, visibility: "PUBLIC" },
      orderBy: { createdAt: "asc" },
    });

    availableGpts = availableGptsRaw.map(mapGpt);

    let conversationRecord =
      conversationId &&
      (await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { gpt: true, messages: { orderBy: { createdAt: "asc" } } },
      }));

    if (!conversationRecord && !isNewChat) {
      conversationRecord = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: { gpt: true, messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (conversationRecord) {
      initialConversation = {
        id: conversationRecord.id,
        title: conversationRecord.title,
        gptId: conversationRecord.gptId,
        updatedAt: conversationRecord.updatedAt.toISOString(),
        gpt: mapGpt(conversationRecord.gpt),
        messages: conversationRecord.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        })),
      };
    }
  }

  return (
    <ChatView
      isUserAuthenticated={!!session?.user?.id}
      initialConversation={initialConversation}
      availableGpts={availableGpts}
      initialDraftGptId={requestedGptId}
    />
  );
}
