"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      dir="rtl"
      position="bottom-right"
      theme="system"
      toastOptions={{
        classNames: {
          toast: "bg-background border text-foreground",
          title: "font-medium",
          description: "text-sm text-muted-foreground",
        },
      }}
    />
  );
}
