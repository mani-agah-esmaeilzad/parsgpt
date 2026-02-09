"use client";

import useSWR from "swr";

export interface PublicGpt {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description: string;
  tags: string[];
  starterPrompts: string[];
  visibility: "PUBLIC" | "PRIVATE";
}

interface GptResponse {
  gpts: PublicGpt[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("خطا در دریافت GPT ها");
  return (await res.json()) as GptResponse;
};

export function useGpts() {
  const { data, error, isLoading, mutate } = useSWR<GptResponse>("/api/gpts", fetcher, {
    refreshInterval: 60_000,
  });

  return {
    gpts: data?.gpts ?? [],
    isLoading,
    error,
    mutate,
  };
}
