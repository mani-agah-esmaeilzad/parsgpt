import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f8f7f2] px-4 dark:bg-black">{children}</div>;
}
