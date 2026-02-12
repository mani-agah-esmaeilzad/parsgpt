import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { mapGpt } from "@/lib/gpts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

interface GptPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: GptPageProps): Promise<Metadata> {
  const record = await prisma.gPT.findUnique({ where: { slug: params.slug } });
  return {
    title: record ? `Chatpars | ${record.name}` : "ParsGPT",
  };
}

export default async function GptDetailPage({ params }: GptPageProps) {
  const session = await getServerSession(authOptions);
  const record = await prisma.gPT.findUnique({ where: { slug: params.slug } });
  if (!record) {
    return notFound();
  }

  if (record.visibility === "PRIVATE" && session?.user.role !== "ADMIN") {
    return notFound();
  }

  const gpt = mapGpt(record);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title={gpt.name} description="جزئیات GPT سفارشی" />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <div className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3 text-3xl">
              <span>{gpt.icon ?? "🤖"}</span>
              <h1 className="font-bold">{gpt.name}</h1>
            </div>
            <p className="mt-2 text-muted-foreground">{gpt.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {gpt.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">پیشنهادها</h2>
            <div className="flex flex-wrap gap-2">
              {gpt.starterPrompts.map((prompt) => (
                <span key={prompt} className="rounded-full border px-3 py-1 text-xs">
                  {prompt}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild size="lg">
              <Link href={`/chat?gptId=${gpt.id}`}>شروع گفتگو</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
