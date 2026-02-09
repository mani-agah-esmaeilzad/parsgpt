import type { GPT } from "@prisma/client";

import { parseStringArray, stringifyStringArray } from "@/lib/serializers";
import type { UiGpt } from "@/types/chat";

export function mapGpt(gpt: GPT): UiGpt {
  return {
    id: gpt.id,
    name: gpt.name,
    slug: gpt.slug,
    icon: gpt.icon,
    description: gpt.description,
    category: gpt.category,
    tags: parseStringArray(gpt.tags),
    starterPrompts: parseStringArray(gpt.starterPrompts),
    model: gpt.model,
    temperature: gpt.temperature,
    topP: gpt.topP,
    maxOutputTokens: gpt.maxOutputTokens ?? undefined,
    visibility: gpt.visibility,
  };
}

export function serializeGptPayload(payload: {
  tags: string[];
  starterPrompts: string[];
}) {
  return {
    tags: stringifyStringArray(payload.tags),
    starterPrompts: stringifyStringArray(payload.starterPrompts),
  };
}
