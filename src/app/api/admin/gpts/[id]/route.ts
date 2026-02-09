import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gptUpsertSchema } from "@/lib/validators";
import { serializeGptPayload } from "@/lib/gpts";
import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseStringArray } from "@/lib/serializers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function mapAdminGpt(gpt: Awaited<ReturnType<typeof prisma.gPT.findUnique>>) {
  if (!gpt) return null;
  return {
    ...gpt,
    tags: parseStringArray(gpt.tags),
    starterPrompts: parseStringArray(gpt.starterPrompts),
  };
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const gpt = await prisma.gPT.findUnique({ where: { id } });
  if (!gpt) {
    return NextResponse.json({ error: "GPT not found" }, { status: 404 });
  }

  return NextResponse.json({ gpt: mapAdminGpt(gpt) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, status } = await requireAdmin({ redirect: false });
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const body = await request.json();
  const parsed = gptUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const serialized = serializeGptPayload({ tags: payload.tags, starterPrompts: payload.starterPrompts });

  const gpt = await prisma.gPT.update({
    where: { id },
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      icon: payload.icon || null,
      tags: serialized.tags,
      category: payload.category,
      systemPrompt: payload.systemPrompt,
      starterPrompts: serialized.starterPrompts,
      model: payload.model,
      temperature: payload.temperature,
      topP: payload.topP,
      maxOutputTokens: payload.maxOutputTokens,
      visibility: payload.visibility,
      enabled: payload.enabled,
    },
  });

  await logAdminAction({
    actorUserId: user.id,
    actionType: "update_gpt",
    entityType: "GPT",
    entityId: id,
    metadata: payload,
  });

  return NextResponse.json({ gpt: mapAdminGpt(gpt) });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, status } = await requireAdmin({ redirect: false });
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  await prisma.gPT.delete({ where: { id } });

  await logAdminAction({
    actorUserId: user.id,
    actionType: "delete_gpt",
    entityType: "GPT",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
