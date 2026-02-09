"use client";

import { UiGpt } from "@/types/chat";
import { Sparkles, ArrowUpRight } from "lucide-react";

interface EmptyStateProps {
  gpt: UiGpt;
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ gpt, onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-background p-4 shadow-sm ring-1 ring-border/50">
          {gpt.icon ? (
            <span className="text-4xl">{gpt.icon}</span>
          ) : (
            <div className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
              <Sparkles className="h-6 w-6" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {gpt.name}
        </h2>
        {gpt.description && (
          <p className="max-w-md text-muted-foreground text-center text-sm leading-relaxed">
            {gpt.description}
          </p>
        )}
      </div>

      {gpt.starterPrompts.length > 0 && (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4">
          {gpt.starterPrompts.slice(0, 4).map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSelectPrompt(prompt)}
              className="group relative flex flex-col items-start gap-2 rounded-xl border bg-background p-4 text-right transition-all hover:bg-muted/50 hover:shadow-sm"
            >
              <span className="text-sm font-medium text-foreground line-clamp-2">
                {prompt}
              </span>
              <div className="absolute left-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
