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
    <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
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

        <div className="relative flex w-full items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring ring-1 ring-border/50">
          <Textarea
            dir="rtl"
            ref={textareaRef}
            placeholder="پیام خود را به ParsGPT بفرستید..."
            className="min-h-[24px] max-h-[200px] w-full resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0 text-base py-[10px]"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "mb-1 h-8 w-8 rounded-lg transition-all",
                    value.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                  disabled={!value.trim() || isStreaming}
                  onClick={handleSubmit}
                >
                  {isStreaming ? (
                    <Square className="h-3 w-3 fill-current" />
                    // Usually "stop" is here if we want integrated stop. 
                    // But ChatGPT has the separate stop button above or integrated. 
                    // We'll keep send button disabled while streaming.
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>ارسال پیام</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-center text-xs text-muted-foreground/50 py-2">
          ParsGPT ممکن است اشتباه کند. اطلاعات مهم را بررسی کنید.
        </div>
      </div>
    </div>
  );
}
