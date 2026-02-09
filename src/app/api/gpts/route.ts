import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { parseStringArray } from "@/lib/serializers";

export async function GET() {
  const session = await getServerSession(authOptions);
  const where = session?.user?.role === "ADMIN"
    ? { enabled: true }
    : { enabled: true, visibility: "PUBLIC" as const };

  const gpts = await prisma.gPT.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    gpts: gpts.map((gpt) => ({
      ...gpt,
      tags: parseStringArray(gpt.tags),
      starterPrompts: parseStringArray(gpt.starterPrompts),
    })),
  });
}
