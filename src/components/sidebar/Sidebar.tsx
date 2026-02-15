"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Compass, Settings, Shield, MoreHorizontal, ChevronLeft, ChevronRight, User, LogOut, PenSquare, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { useConversations, type ConversationPreview } from "@/hooks/use-conversations";
import { useSidebar } from "@/components/layout/AppShell";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getConversationGroup } from "@/lib/date";

interface SidebarProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  today: "امروز",
  yesterday: "دیروز",
  last7: "۷ روز اخیر",
  older: "قدیمی‌تر",
};

export function Sidebar({ isMobile, isCollapsed: propCollapsed, onNavigate }: SidebarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const { conversations, isLoading: loadingConversations, mutate } = useConversations();
  const { toggleCollapse, isCollapsed: contextCollapsed } = useSidebar();

  // Use prop if provided (e.g. mobile), otherwise usage context
  const isCollapsed = isMobile ? false : (propCollapsed ?? contextCollapsed);
  const activeConversationId = searchParams?.get("conversationId") ?? null;

  const grouped = useMemo(() => {
    const buckets: Record<string, ConversationPreview[]> = {
      today: [],
      yesterday: [],
      last7: [],
      older: [],
    };
    conversations.forEach((conversation) => {
      const group = getConversationGroup(new Date(conversation.updatedAt));
      if (buckets[group]) buckets[group].push(conversation);
    });
    return buckets;
  }, [conversations]);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat?conversationId=${conversationId}`);
    onNavigate?.();
  };

  const handleNewChat = () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent("/chat")}`);
      return;
    }
    // Just navigate to /chat to start fresh (or empty state)
    // If backend requires creating one immediately, logic might differ, 
    // but usually /chat is "New Chat" state.
    router.push("/chat?new=1");
    router.refresh();
    onNavigate?.();
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("آیا از حذف این گفتگو مطمئن هستید؟")) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      await mutate();
      if (activeConversationId === id) {
        router.push("/chat?new=1");
        router.refresh();
      }
      toast.success("گفتگو حذف شد");
    } catch {
      toast.error("خطا در حذف گفتگو");
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className={cn("flex items-center justify-between px-4 pt-5 pb-3", isCollapsed && "justify-center")}>
        <Link href="/" className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          <Image src="/logo.png" alt="ParsGPT" width={36} height={36} className="size-9 rounded-full" />
          {!isCollapsed && <span className="text-sm font-semibold">ParsGPT</span>}
        </Link>
        {!isMobile && !isCollapsed && (
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8 text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Header: New Chat + Collapse */}
      <div className={cn("flex items-center px-3 pb-3", isCollapsed ? "justify-center" : "justify-between")}>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-10 w-10">
                  <PenSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">گفتگوی جدید</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            className="flex-1 justify-start gap-2 border border-black/10 bg-white/80 text-sm text-neutral-700 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">گفتگوی جدید</span>
          </Button>
        )}

        {/* collapse handled in header */}
      </div>

      {/* Navigation LInks */}
      <div className="px-3 pb-2">
        <Link
          href="/explore"
          onClick={onNavigate}
          className={cn(
            "flex items-center rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-white/80 dark:hover:bg-white/10",
            isCollapsed ? "justify-center px-0" : "gap-2",
            pathname === "/explore" && "bg-white/90 text-foreground shadow-sm dark:bg-white/10"
          )}
        >
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Compass className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right">کاوش GPT ها</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <Compass className="h-4 w-4" />
              <span>کاوش GPT ها</span>
            </>
          )}
        </Link>
      </div>


      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        {loadingConversations ? (
          <div className="space-y-4 py-4">
            {/* Skeletons */}
            {[1, 2, 3].map(i => <div key={i} className="h-5 w-3/4 animate-pulse rounded bg-muted/50 mx-auto" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {Object.entries(grouped).map(([group, items]) => {
              if (!items.length) return null;
              if (isCollapsed) {
                // In collapsed mode, maybe skipping group headers or showing simple tooltips
                return items.map(c => (
                  <TooltipProvider key={c.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleConversationClick(c.id)}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors hover:bg-white/80 dark:hover:bg-white/10 mx-auto",
                            activeConversationId === c.id && "bg-white/90 text-foreground shadow-sm dark:bg-white/10"
                          )}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">{c.gpt?.icon ?? "🤖"}</AvatarFallback>
                          </Avatar>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="max-w-[200px] truncate">{c.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ));
              }

              return (
                <div key={group}>
                  <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground/70">{GROUP_LABELS[group]}</h3>
                  <div className="flex flex-col gap-0.5">
                    {items.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-2xl px-2 py-2 text-sm transition-colors hover:bg-white/70 dark:hover:bg-white/10 relative cursor-pointer",
                          activeConversationId === conversation.id && "bg-white/90 text-foreground shadow-sm dark:bg-white/10"
                        )}
                        onClick={() => handleConversationClick(conversation.id)}
                      >
                        {/* We can use the GPT icon or just text. ChatGPT uses text mostly. */}
                        <span className="flex-1 truncate">{conversation.title}</span>

                        {/* Hover Actions */}
                        <div className={cn("absolute left-2 hidden items-center gap-1 group-hover:flex", activeConversationId === conversation.id && "flex")}>
                          {/* Gradient fade if needed, but simple buttons work */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Implement rename logic if possible here or reusing global dialog */ }}>
                                <PenSquare className="mr-2 h-4 w-4" />
                                تغییر نام
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteConversation(conversation.id, e)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!Object.values(grouped).some((items) => items.length) && !isCollapsed && (
              <div className="text-center py-10 opacity-50">
                <p className="text-sm">تاریخچه‌ای یافت نشد</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* User Footer */}
      <div className="border-t border-black/5 p-2 dark:border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-2xl py-5 hover:bg-white/80 dark:hover:bg-white/10",
                isCollapsed ? "justify-center px-0" : "px-2"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-white">
                  {session?.user?.name?.[0] ?? <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="mr-3 flex flex-col items-start text-right">
                  <span className="text-sm font-medium">{session?.user?.name ?? "کاربر مهمان"}</span>
                  <span className="text-xs text-muted-foreground">طرح رایگان</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px] mb-2">
            <div className="px-2 py-1.5 text-sm font-medium">
              {session?.user?.email ?? "Guest"}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { onNavigate?.(); router.push("/settings"); }}>
              <Settings className="mr-2 h-4 w-4" />
              تنظیمات
            </DropdownMenuItem>
            {session?.user?.role === "ADMIN" && (
              <DropdownMenuItem onClick={() => { onNavigate?.(); router.push("/admin"); }}>
                <Shield className="mr-2 h-4 w-4" />
                مدیریت سیستم
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {isAuthenticated ? (
              <DropdownMenuItem onClick={() => router.push("/api/auth/signout")}>
                <LogOut className="mr-2 h-4 w-4" />
                خروج
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => router.push("/sign-in")}>
                <User className="mr-2 h-4 w-4" />
                ورود
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle Button for Desktop (if logic requires it at bottom, but top is standard for ChatGPT now) */}
        {/* If collapsed, show an expand button? Actually "New Chat" logic usually implies clicking something to expand or a small arrow. 
             If we use the top arrow to close, we need a way to open. 
         */}
        {isCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto mt-2 h-6 w-6 text-muted-foreground"
            onClick={toggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
