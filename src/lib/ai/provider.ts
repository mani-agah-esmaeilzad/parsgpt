import { createParser } from "eventsource-parser";

import { countTokens, countTokensForMessages } from "@/lib/tokens";

export type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
  estimated: boolean;
}

interface StreamArgs {
  messages: ProviderMessage[];
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens?: number | null;
  signal?: AbortSignal;
}

export async function streamChatCompletion(args: StreamArgs) {
  const { messages, model, temperature, topP, maxOutputTokens, signal } = args;
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const baseUrl = process.env.AI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      top_p: topP,
      max_tokens: maxOutputTokens ?? undefined,
      stream: true,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(errorText || `AI provider error (${response.status})`);
  }
  const responseBody = response.body;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let controllerResolve: ((value: { content: string; usage: ProviderUsage }) => void) | null = null;
  let controllerReject: ((reason?: unknown) => void) | null = null;
  const finalResult = new Promise<{ content: string; usage: ProviderUsage }>((resolve, reject) => {
    controllerResolve = resolve;
    controllerReject = reject;
  });

  const provider = baseUrl;
  const assistantChunks: string[] = [];
  let usageFromProvider: ProviderUsage | null = null;
  let providerModel = model;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const parser = createParser({
        onEvent(event) {
        if (event.data === "[DONE]") {
          const fullContent = assistantChunks.join("");
          const promptEstimation = countTokensForMessages(messages, model);
          const completionEstimation = countTokens(fullContent, model);
          const usage: ProviderUsage = usageFromProvider ?? {
            promptTokens: promptEstimation.tokens,
            completionTokens: completionEstimation.tokens,
            totalTokens: promptEstimation.tokens + completionEstimation.tokens,
            model: providerModel,
            provider,
            estimated: promptEstimation.estimated || completionEstimation.estimated,
          };
          controllerResolve?.({ content: fullContent, usage });
          controller.close();
          return;
        }

        try {
          const json = JSON.parse(event.data);
          const delta = json.choices?.[0]?.delta;
          if (json.model) {
            providerModel = json.model as string;
          }
          if (delta?.content) {
            assistantChunks.push(delta.content as string);
            controller.enqueue(encoder.encode(delta.content));
          }
          if (json.usage) {
            usageFromProvider = {
              promptTokens: json.usage.prompt_tokens ?? 0,
              completionTokens: json.usage.completion_tokens ?? 0,
              totalTokens: json.usage.total_tokens ?? 0,
              model: providerModel,
              provider,
              estimated: false,
            };
          }
        } catch (error) {
          controller.error(error);
          controllerReject?.(error);
        }
      },
        onError(error) {
          controller.error(error);
          controllerReject?.(error);
        },
      });

      try {
        const reader = responseBody.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value));
        }
      } catch (error) {
        controller.error(error);
        controllerReject?.(error);
      }
    },
  });

  return { stream, finalResult };
}
