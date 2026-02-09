import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import type { Conversation, GPT, Message } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { conversationUpdateSchema } from "@/lib/validators";
import { authOptions } from "@/lib/auth/options";
import { parseStringArray } from "@/lib/serializers";

type ConversationWithRelations = Conversation & { gpt: GPT; messages: Message[] };

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      gpt: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation: mapConversation(conversation) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = conversationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: { title: parsed.data.title },
  });

  return NextResponse.json({ conversation: updated });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await prisma.conversation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
