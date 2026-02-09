"use client";

import { useState } from "react";
import { Menu, MoreVertical } from "lucide-react";

import type { UiConversation, UiGpt } from "@/types/chat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/layout/AppShell";

interface ChatHeaderProps {
  conversation: UiConversation | null;
  activeGpt: UiGpt | null;
  availableGpts: UiGpt[];
  pendingGptId: string;
  onRename: (title: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onGptChange: (id: string) => void;
}

export function ChatHeader({
  conversation,
  activeGpt,
  availableGpts,
  pendingGptId,
  onRename,
  onDelete,
  onGptChange,
}: ChatHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const [renameOpen, setRenameOpen] = useState(false);
  const [pendingTitle, setPendingTitle] = useState(conversation?.title ?? "گفتگوی جدید");

  const openRenameDialog = () => {
    setPendingTitle(conversation?.title ?? "گفتگوی جدید");
    setRenameOpen(true);
  };

  const handleRename = async () => {
    await onRename(pendingTitle);
    setRenameOpen(false);
  };

  return (
    <div className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {conversation?.title ?? "گفتگوی جدید"}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{activeGpt?.icon ?? "🤖"}</span>
            <span className="truncate">{activeGpt?.name ?? "بدون GPT"}</span>
            {activeGpt && activeGpt.visibility === "PRIVATE" && (
              <Badge variant="secondary">خصوصی</Badge>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!conversation && availableGpts.length > 0 && (
          <Select value={pendingGptId} onValueChange={onGptChange}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="انتخاب GPT" />
            </SelectTrigger>
            <SelectContent>
              {availableGpts.map((gpt) => (
                <SelectItem key={gpt.id} value={gpt.id}>
                  {gpt.icon ?? "🤖"} {gpt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {conversation && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    openRenameDialog();
                  }}
                >
                  تغییر عنوان
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("این گفتگو حذف شود؟")) onDelete();
                  }}
                >
                  حذف گفتگو
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تغییر عنوان گفتگو</DialogTitle>
                </DialogHeader>
                <Input value={pendingTitle} onChange={(event) => setPendingTitle(event.target.value)} />
                <DialogFooter>
                  <Button onClick={handleRename}>ذخیره</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
