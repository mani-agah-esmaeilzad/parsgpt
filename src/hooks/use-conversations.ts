"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";

export interface ConversationPreview {
  id: string;
  title: string;
  updatedAt: string;
  gpt: {
    id: string;
    name: string;
    icon?: string | null;
  };
  messages?: { id: string; content: string }[];
}

interface ConversationsResponse {
  conversations: ConversationPreview[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("خطا در دریافت گفتگوها");
  return (await res.json()) as ConversationsResponse;
};

export function useConversations() {
  const { status } = useSession();
  const shouldFetch = status === "authenticated";
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    shouldFetch ? "/api/conversations" : null,
    fetcher,
    {
      refreshInterval: 30_000,
    },
  );

  return {
    conversations: data?.conversations ?? [],
    isLoading: shouldFetch ? isLoading : false,
    error,
    mutate,
  };
}
