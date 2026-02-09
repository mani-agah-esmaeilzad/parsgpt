import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session.user;
}

export function assertAdmin(role: Role) {
  if (role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}
