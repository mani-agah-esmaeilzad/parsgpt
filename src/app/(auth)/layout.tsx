import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center px-4">
      <div className="w-full max-w-md p-6">
        <Link href="/" className="flex justify-center items-center mb-4 z-10">
          <Image
            className="size-32 md:hover:scale-95 active:scale-95 transition-transform mb-0.5"
            src="/logo.png"
            alt={`chatpars logo`}
            width={180}
            height={38}
            priority
          />
        </Link>
        {children}
      </div>
    </div>
  );
}
