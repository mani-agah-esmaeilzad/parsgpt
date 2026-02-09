import { encodingForModel } from "js-tiktoken";

export function countTokens(text: string, model = "gpt-4o-mini") {
  try {
    const encoding = encodingForModel(model);
    const tokens = encoding.encode(text).length;
    encoding.free();
    return { tokens, estimated: false } as const;
  } catch {
    return { tokens: Math.ceil(text.length / 4), estimated: true } as const;
  }
}

export function countTokensForMessages(
  messages: { role: string; content: string }[],
  model = "gpt-4o-mini",
) {
  const joined = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  return countTokens(joined, model);
}
