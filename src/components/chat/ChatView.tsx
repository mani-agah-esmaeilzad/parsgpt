"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { UiConversation, UiGpt, UiMessage } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmptyState } from "@/components/chat/EmptyState";
import { useConversations } from "@/hooks/use-conversations";

interface ChatViewProps {
  initialConversation: UiConversation | null;
  availableGpts: UiGpt[];
  initialDraftGptId?: string;
}

export function ChatView({ initialConversation, availableGpts, initialDraftGptId }: ChatViewProps) {
  const [conversation, setConversation] = useState<UiConversation | null>(initialConversation);
  const [messages, setMessages] = useState<UiMessage[]>(initialConversation?.messages ?? []);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [draftGptId, setDraftGptId] = useState(
    initialConversation?.gptId ?? initialDraftGptId ?? availableGpts[0]?.id ?? "",
  );
  const { mutate: mutateSidebar } = useConversations();

  useEffect(() => {
    setConversation(initialConversation);
    setMessages(initialConversation?.messages ?? []);
    if (initialConversation?.gptId) {
      setDraftGptId(initialConversation.gptId);
    } else if (initialDraftGptId) {
      setDraftGptId(initialDraftGptId);
    }
  }, [initialConversation, initialDraftGptId]);

  const activeGpt = useMemo(() => {
    if (!availableGpts.length) return null;
    return (
      availableGpts.find((gpt) => gpt.id === (conversation?.gptId ?? draftGptId)) ??
      availableGpts[0]
    );
  }, [availableGpts, conversation?.gptId, draftGptId]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    if (!conversation && (!draftGptId || !activeGpt)) {
      toast.error("هیچ GPT ی انتخاب نشده است");
      return;
    }

    const payload = conversation
      ? { conversationId: conversation.id, userMessage: content }
      : { gptId: draftGptId, userMessage: content };

    const tempUserMessage: UiMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setStreamingMessage("");
    setIsStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("failed");
      }

      const conversationId = response.headers.get("X-Conversation-Id");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingMessage(fullText);
      }

      setStreamingMessage(null);
      await refreshConversation(conversationId ?? conversation?.id ?? null);
      await mutateSidebar();
    } catch (error) {
      console.error(error);
      toast.error("ارسال پیام ناموفق بود");
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const refreshConversation = async (id: string | null) => {
    if (!id) return;
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    const nextConversation = normalizeConversation(data.conversation);
    setConversation(nextConversation);
    setMessages(nextConversation.messages);
    setDraftGptId(nextConversation.gptId);
  };

  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    setStreamingMessage(null);
  };

  const handleRegenerate = async () => {
    if (!conversation) {
      toast.error("هیچ گفتگویی برای بازتولید وجود ندارد");
      return;
    }

    setMessages((prev) => {
      const next = [...prev];
      const index = [...next].reverse().findIndex((message) => message.role === "assistant");
      if (index !== -1) {
        next.splice(next.length - 1 - index, 1);
      }
      return next;
    });

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, regenerate: true }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error("failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingMessage(fullText);
      }

      setStreamingMessage(null);
      await refreshConversation(conversation.id);
      await mutateSidebar();
    } catch (error) {
      console.error(error);
      toast.error("بازتولید با مشکل مواجه شد");
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleRename = async (title: string) => {
    if (!conversation) return;
    const response = await fetch(`/api/conversations/${conversation.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      toast.error("امکان تغییر عنوان نبود");
      return;
    }
    setConversation((prev) => (prev ? { ...prev, title } : prev));
    await mutateSidebar();
  };

  const handleDelete = async () => {
    if (!conversation) return;
    const response = await fetch(`/api/conversations/${conversation.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error("حذف گفتگو انجام نشد");
      return;
    }
    setConversation(null);
    setMessages([]);
    setStreamingMessage(null);
    setDraftGptId(availableGpts[0]?.id ?? "");
    await mutateSidebar();
  };

  const showEmptyState = !messages.length && !streamingMessage;
  const canRegenerate =
    Boolean(conversation) &&
    (messages.some((message) => message.role === "assistant") || Boolean(streamingMessage));

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        conversation={conversation}
        activeGpt={activeGpt}
        availableGpts={availableGpts}
        onRename={handleRename}
        onDelete={handleDelete}
        pendingGptId={draftGptId}
        onGptChange={(id) => setDraftGptId(id)}
      />
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {showEmptyState ? (
            activeGpt ? (
              <EmptyState gpt={activeGpt} onSelectPrompt={handleSend} />
            ) : (
              <p className="text-center text-sm text-muted-foreground mt-20">
                هیچ GPT فعالی تعریف نشده است. ابتدا یک GPT بسازید.
              </p>
            )
          ) : (
            <MessageList messages={messages} streamingContent={streamingMessage} />
          )}
        </div>
        <ChatComposer
          onSend={handleSend}
          onStop={handleStop}
          onRegenerate={handleRegenerate}
          isStreaming={isStreaming}
          canRegenerate={canRegenerate}
        />
      </div>
    </div>
  );
}

type ApiConversation = {
  id: string;
  title: string;
  gptId: string;
  updatedAt: string;
  gpt: UiGpt;
  messages: UiMessage[];
};

function normalizeConversation(conversation: ApiConversation): UiConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    gptId: conversation.gptId,
    updatedAt: conversation.updatedAt,
    gpt: {
      id: conversation.gpt.id,
      name: conversation.gpt.name,
      slug: conversation.gpt.slug,
      icon: conversation.gpt.icon,
      description: conversation.gpt.description,
      tags: conversation.gpt.tags ?? [],
      starterPrompts: conversation.gpt.starterPrompts ?? [],
      model: conversation.gpt.model,
      temperature: conversation.gpt.temperature,
      topP: conversation.gpt.topP,
      maxOutputTokens: conversation.gpt.maxOutputTokens ?? undefined,
      visibility: conversation.gpt.visibility,
    },
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  };
}
