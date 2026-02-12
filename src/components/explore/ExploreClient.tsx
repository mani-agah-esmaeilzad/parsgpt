"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { UiGpt } from "@/types/chat";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { GptCard } from "@/components/explore/GptCard";
import { cn } from "@/lib/utils";

interface ExploreClientProps {
  gpts: UiGpt[];
}

export function ExploreClient({ gpts }: ExploreClientProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    gpts.forEach((gpt) => {
      if (gpt.category) unique.add(gpt.category);
    });
    return Array.from(unique);
  }, [gpts]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return gpts.filter((gpt) => {
      const matchesText =
        !normalizedQuery ||
        gpt.name.toLowerCase().includes(normalizedQuery) ||
        gpt.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory ? gpt.category === selectedCategory : true;
      return matchesText && matchesCategory;
    });
  }, [gpts, query, selectedCategory]);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6 md:py-12">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">
          اکتشاف GPT های سفارشی
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-300 max-w-2xl">
          بهترین دستیارهای هوش مصنوعی را برای کارهای روزمره، برنامه‌نویسی، و خلاقیت پیدا کنید.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-lg mt-2">
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-6 h-12 rounded-3xl md:rounded-4xl bg-[#F2F2F2] md:bg-white border-0 md:border md:border-neutral-400/25 dark:md:border-transparent md:shadow-md dark:bg-[#303030] backdrop-blur-3xl transition-all text-base shadow-sm"
            placeholder="جستجو در بین GPT ها..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={cn(
              selectedCategory === null ? "border-[#9138C9]" : "",
              "rounded-full border"
            )}
            onClick={() => setSelectedCategory(null)}
          >
            همه
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className={cn(
                selectedCategory === cat ? "border-[#9138C9]" : "",
                "rounded-full border"
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="min-h-[400px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl">
            <Search className="h-10 w-10 mb-4 opacity-50" />
            <p>موردی یافت نشد.</p>
            <Button variant="link" onClick={() => { setQuery(""); setSelectedCategory(null); }}>
              پاک‌سازی فیلترها
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(gpt => (
              <GptCard key={gpt.id} gpt={gpt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
