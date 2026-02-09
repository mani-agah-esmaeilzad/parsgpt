import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gptUpsertSchema } from "@/lib/validators";
import { serializeGptPayload } from "@/lib/gpts";
import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminGpts } from "@/lib/admin/queries";

export async function GET() {
  const { status } = await requireAdmin({ redirect: false });
  if (status !== 200) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const gpts = await getAdminGpts();
  return NextResponse.json({ gpts });
}

export async function POST(request: Request) {
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

  const gpt = await prisma.gPT.create({
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
    actionType: "create_gpt",
    entityType: "GPT",
    entityId: gpt.id,
    metadata: payload,
  });

  return NextResponse.json({ gpt }, { status: 201 });
}
