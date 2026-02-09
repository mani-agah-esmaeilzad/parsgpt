import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth/options";

interface GuardResult {
  user: Session["user"] | null;
  status: 200 | 401 | 403;
}

interface GuardOptions {
  /**
   * When false, the guard will return a GuardResult instead of redirecting.
   * Useful for API route handlers.
   */
  redirect?: boolean;
}

export async function requireAdmin(options?: GuardOptions): Promise<GuardResult> {
  const shouldRedirect = options?.redirect ?? true;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    if (shouldRedirect) {
      redirect("/sign-in");
    }
    return { user: null, status: 401 };
  }

  if (session.user.role !== "ADMIN") {
    if (shouldRedirect) {
      redirect("/chat");
    }
    return { user: null, status: 403 };
  }

  return { user: session.user, status: 200 };
}
