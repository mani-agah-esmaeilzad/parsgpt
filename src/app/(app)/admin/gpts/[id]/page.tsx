import { notFound } from "next/navigation";

import { GptForm } from "@/components/admin/GptForm";
import { getAdminGptById } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function AdminGptEditPage({ params }: PageProps) {
  const record = await getAdminGptById(params.id);
  if (!record) {
    notFound();
  }

  const gpt = {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    icon: record.icon,
    tags: record.tags,
    category: record.category,
    systemPrompt: record.systemPrompt,
    starterPrompts: record.starterPrompts,
    model: record.model,
    temperature: record.temperature,
    topP: record.topP,
    maxOutputTokens: record.maxOutputTokens,
    visibility: record.visibility,
    enabled: record.enabled,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <GptForm mode="edit" gpt={gpt} />
    </div>
  );
}
