import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { mapGpt } from "@/lib/gpts";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chatpars | کاوش GPT ها",
};

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);
  const gpts = await prisma.gPT.findMany({
    where:
      session?.user.role === "ADMIN"
        ? { enabled: true }
        : { enabled: true, visibility: "PUBLIC" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col overflow-y-auto">
      <PageHeader title="کاوش GPT ها" />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-10">
        <ExploreClient gpts={gpts.map(mapGpt)} />
      </div>
    </div>
  );
}
