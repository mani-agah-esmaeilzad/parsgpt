"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AdminNavProps {
  links: { href: string; label: string }[];
}

export function AdminNav({ links }: AdminNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm text-muted-foreground transition hover:text-foreground",
            pathname === link.href && "font-semibold text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
