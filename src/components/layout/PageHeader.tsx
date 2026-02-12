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
    <div className="flex items-center sticky top-0 z-40 justify-between gap-3 border-b border-neutral-400/25 bg-white dark:bg-black px-4 py-2 md:px-6 pt-safe-10">
      <div className="text-right mt-2">
        <h1 className="text-xl font-semibold mt-0.5">{title}</h1>
        {description && <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-2">{description}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className='grid gap-2 p-3 rounded-lg cursor-pointer md:hidden'
        onClick={toggleSidebar}
      >
        <div className='bg-black dark:bg-white rounded-full h-0.5 w-5' />
        <div className='bg-black dark:bg-white rounded-full h-0.5 w-3 ms-auto' />
      </Button>
    </div>
  );
}
