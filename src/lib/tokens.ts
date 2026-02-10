import { encodingForModel } from "js-tiktoken";
import type { TiktokenModel } from "js-tiktoken";

export function countTokens(text: string, model: TiktokenModel | string = "gpt-4o-mini") {
  try {
    const encoding = encodingForModel(model as TiktokenModel);
    const tokens = encoding.encode(text).length;
    const maybeFree = (encoding as unknown as { free?: () => void }).free;
    if (typeof maybeFree === "function") {
      maybeFree();
    }
    return { tokens, estimated: false } as const;
  } catch {
    return { tokens: Math.ceil(text.length / 4), estimated: true } as const;
  }
}

export function countTokensForMessages(
  messages: { role: string; content: string }[],
  model: TiktokenModel | string = "gpt-4o-mini",
) {
  const joined = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  return countTokens(joined, model);
}
