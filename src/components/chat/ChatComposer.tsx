"use client";

import { useRef, useEffect, useState } from "react";
import { Square, ArrowUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  isStreaming: boolean;
  canRegenerate?: boolean;
}

export function ChatComposer({ onSend, onStop, onRegenerate, isStreaming, canRegenerate }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 md:px-4 pb-safe">
      <div className="relative flex flex-col items-center justify-center gap-2">
        {/* Regererate / Stop Controls (Optional helper buttons above input) */}
        {(isStreaming || canRegenerate) && (
          <div className="mb-2 flex gap-2">
            {isStreaming ? (
              <Button variant="secondary" size="sm" onClick={onStop} className="h-8 shadow-sm border">
                <Square className="mr-2 h-3 w-3 fill-current" />
                توقف تولید
              </Button>
            ) : (
              canRegenerate && (
                <Button variant="secondary" size="sm" onClick={onRegenerate} className="h-8 shadow-sm border">
                  <RefreshCw className="mr-2 h-3 w-3" />
                  بازتولید پاسخ
                </Button>
              )
            )}
          </div>
        )}

        <div className="relative flex w-full items-end">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "m-1.5 size-12 rounded-full transition-all bg-black text-white dark:bg-white dark:text-black",
                  )}
                  disabled={!value.trim() || isStreaming}
                  onClick={handleSubmit}
                >
                  {isStreaming ? (
                    <Square className="size-4 fill-current" />
                    // Usually "stop" is here if we want integrated stop. 
                    // But ChatGPT has the separate stop button above or integrated. 
                    // We'll keep send button disabled while streaming.
                  ) : (
                    <ArrowUp className="size-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>ارسال پیام</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative flex w-full items-end rounded-3xl border-0 md:rounded-4xl bg-[#F2F2F2] md:bg-white md:border md:border-neutral-400/25 dark:md:border-transparent md:shadow-md dark:bg-[#303030] backdrop-blur-3xl transition-all pe-1.5">
            <Textarea
              dir="rtl"
              ref={textareaRef}
              placeholder="پیام خود را به چت‌پارس بفرستید..."
              className="max-h-[200px] w-full resize-none border-0 bg-transparent px-5 shadow-none focus-visible:ring-0 text-base"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={false}
            />
          </div>
        </div>
        <div className="text-center text-[10px] text-muted-foreground/50 pb-2">
          ParsGPT ممکن است اشتباه کند. اطلاعات مهم را بررسی کنید.
        </div>
      </div>
    </div>
  );
}
