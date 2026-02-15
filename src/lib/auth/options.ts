import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isValidIranPhone, normalizeIranPhone } from "@/lib/phone";
import type { Role } from "@prisma/client";

const credentialsSchema = z.object({
  phone: z.string().min(10),
  code: z.string().min(4),
});

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { phone, code } = parsed.data;
        const normalized = normalizeIranPhone(phone);
        if (!isValidIranPhone(normalized)) {
          return null;
        }

        const otpRecord = await prisma.otpCode.findUnique({ where: { phone: normalized } });
        if (!otpRecord) {
          return null;
        }

        if (otpRecord.expiresAt < new Date() || otpRecord.attemptsLeft <= 0) {
          return null;
        }

        const isValid = await bcrypt.compare(code, otpRecord.codeHash);
        if (!isValid) {
          await prisma.otpCode.update({
            where: { phone: normalized },
            data: { attemptsLeft: { decrement: 1 } },
          });
          return null;
        }

        await prisma.otpCode.delete({ where: { phone: normalized } });

        let user = await prisma.user.findUnique({ where: { phone: normalized } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: normalized,
              role: "USER",
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        } satisfies {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          role: Role;
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
        token.phone = (user as { phone?: string | null }).phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "USER";
        session.user.phone = (token.phone as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};
