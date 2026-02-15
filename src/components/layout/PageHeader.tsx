"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/AppShell";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-[#f8f7f2]/80 px-4 py-3 backdrop-blur-md md:px-6 dark:border-white/10 dark:bg-black/40">
      <div className="text-right">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
