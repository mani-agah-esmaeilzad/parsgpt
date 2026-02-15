"use client";

import { useEffect, useRef } from "react";
import type { UiMessage } from "@/types/chat";
import { MessageItem } from "@/components/chat/MessageItem";

interface MessageListProps {
  messages: UiMessage[];
  streamingContent: string | null;
}

export function MessageList({ messages, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Combine messages + optional streaming message
  const combinedMessages = streamingContent
    ? [
      ...messages,
      {
        id: "streaming-temp-id",
        role: "assistant" as const,
        content: streamingContent,
        createdAt: new Date().toISOString(),
      },
    ]
    : messages;

  // Auto-scroll to bottom on new message
  // In a real app we might want smart scrolling (only if near bottom)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [combinedMessages.length, streamingContent]);

  return (
    <div className="flex flex-col pb-16 pt-6 text-base">
      {combinedMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={message.id === "streaming-temp-id"}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
