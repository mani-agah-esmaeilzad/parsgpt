import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import type { Conversation, GPT, Message } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { conversationCreateSchema } from "@/lib/validators";
import { authOptions } from "@/lib/auth/options";
import { parseStringArray } from "@/lib/serializers";

type ConversationWithRelations = Conversation & {
  gpt: GPT;
  messages: Message[];
};

function mapConversation(conversation: ConversationWithRelations) {
  return {
    ...conversation,
    gpt: {
      ...conversation.gpt,
      tags: parseStringArray(conversation.gpt.tags),
      starterPrompts: parseStringArray(conversation.gpt.starterPrompts),
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationsRaw = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      gpt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({ conversations: conversationsRaw.map(mapConversation) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = conversationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const gpt = await prisma.gPT.findUnique({ where: { id: parsed.data.gptId } });
  if (!gpt || !gpt.enabled) {
    return NextResponse.json({ error: "GPT در دسترس نیست" }, { status: 404 });
  }

  if (gpt.visibility === "PRIVATE" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "اجازه دسترسی ندارید" }, { status: 403 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      gptId: gpt.id,
    },
    include: {
      gpt: true,
    },
  });

  return NextResponse.json({ conversation: mapConversation({ ...conversation, messages: [] }) });
}
